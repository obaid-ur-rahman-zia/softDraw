"use client";

import { useEffect, useRef, useState } from "react";
import { Hand as HandIcon, X } from "lucide-react";

interface HandDrawControllerProps {
  /** Called each frame with the fingertip screen position (null if no hand) and pinch state. */
  onHand: (screen: { x: number; y: number } | null, pinching: boolean) => void;
  onClose: () => void;
}

/** First-order low-pass filter. */
function lowPass() {
  let y: number | null = null;
  return {
    filter(x: number, alpha: number) {
      y = y == null ? x : alpha * x + (1 - alpha) * y;
      return y;
    },
    reset() {
      y = null;
    },
  };
}

/**
 * 1€ filter — adaptive smoothing for noisy pointer signals. Low speed → heavy
 * smoothing (kills jitter); high speed → little lag. https://gery.casiez.net/1euro/
 */
function oneEuro(minCutoff: number, beta: number, dCutoff: number) {
  const xf = lowPass();
  const dxf = lowPass();
  let lastT: number | null = null;
  let lastX: number | null = null;
  const alpha = (cutoff: number, dt: number) => {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  };
  return {
    filter(x: number, t: number) {
      const dt = lastT == null ? 1 / 60 : Math.max((t - lastT) / 1000, 1e-3);
      lastT = t;
      const dx = lastX == null ? 0 : (x - lastX) / dt;
      lastX = x;
      const edx = dxf.filter(dx, alpha(dCutoff, dt));
      const cutoff = minCutoff + beta * Math.abs(edx);
      return xf.filter(x, alpha(cutoff, dt));
    },
    reset() {
      xf.reset();
      dxf.reset();
      lastT = null;
      lastX = null;
    },
  };
}

export function HandDrawController({ onHand, onClose }: HandDrawControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const onHandRef = useRef(onHand);
  onHandRef.current = onHand;

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [pinching, setPinching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: {
      detectForVideo: (
        v: HTMLVideoElement,
        t: number
      ) => { landmarks?: { x: number; y: number }[][] };
      close: () => void;
    } | null = null;
    let lastVideoTime = -1;

    // Smooth the fingertip in normalised (0..1) space — resolution independent.
    const fx = oneEuro(1.0, 0.7, 1.0);
    const fy = oneEuro(1.0, 0.7, 1.0);
    let pinchState = false;

    async function init() {
      try {
        const { HandLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        const lm = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (cancelled) {
          lm.close();
          return;
        }
        landmarker = lm;

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setStatus("ready");
        loop();
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg((e as Error)?.message ?? "Camera or model unavailable");
        }
      }
    }

    function loop() {
      const video = videoRef.current;
      if (!video || !landmarker) return;
      if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
        lastVideoTime = video.currentTime;
        const now = performance.now();
        const res = landmarker.detectForVideo(video, now);
        if (res.landmarks && res.landmarks.length > 0) {
          const hand = res.landmarks[0];
          const idx = hand[8]; // index fingertip
          const thumb = hand[4]; // thumb tip
          const wrist = hand[0];
          const midMcp = hand[9]; // middle-finger base — palm-size reference

          // Scale-invariant pinch: distance thumb↔index relative to palm size.
          const pinchDist = Math.hypot(idx.x - thumb.x, idx.y - thumb.y);
          const refLen =
            Math.hypot(wrist.x - midMcp.x, wrist.y - midMcp.y) || 0.001;
          const ratio = pinchDist / refLen;
          // Hysteresis so the pen doesn't flicker on/off mid-stroke.
          if (!pinchState && ratio < 0.5) pinchState = true;
          else if (pinchState && ratio > 0.72) pinchState = false;

          // Smoothed, mirrored fingertip → viewport coords.
          const sx = fx.filter(1 - idx.x, now);
          const sy = fy.filter(idx.y, now);
          onHandRef.current(
            { x: sx * window.innerWidth, y: sy * window.innerHeight },
            pinchState
          );
          setPinching(pinchState);
        } else {
          pinchState = false;
          fx.reset();
          fy.reset();
          onHandRef.current(null, false);
          setPinching(false);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    init();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      landmarker?.close();
      stream?.getTracks().forEach((t) => t.stop());
      onHandRef.current(null, false);
    };
  }, []);

  return (
    <div className="absolute bottom-16 right-3 z-30 w-44 rounded-lg overflow-hidden shadow-lg bg-black select-none">
      <video
        ref={videoRef}
        className="w-44 h-32 object-cover -scale-x-100"
        muted
        playsInline
      />
      <div className="flex items-center justify-between px-2 py-1 bg-neutral-900 text-white text-[11px]">
        <span className="flex items-center gap-1">
          <HandIcon className="h-3 w-3" />
          {status === "loading"
            ? "Loading…"
            : status === "error"
              ? "Error"
              : pinching
                ? "✏️ Drawing…"
                : "Pinch 👌 to draw"}
        </span>
        <button onClick={onClose} className="hover:text-red-400">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {status === "error" && (
        <div className="px-2 py-1 text-[10px] text-red-300 bg-neutral-900">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
