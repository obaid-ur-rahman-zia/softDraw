"use client";

import { useEffect, useRef, useState } from "react";
import { Hand as HandIcon, X } from "lucide-react";

interface HandDrawControllerProps {
  /** Called each frame with the fingertip screen position (null if no hand) and pinch state. */
  onHand: (screen: { x: number; y: number } | null, pinching: boolean) => void;
  onClose: () => void;
}

export function HandDrawController({ onHand, onClose }: HandDrawControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const onHandRef = useRef(onHand);
  onHandRef.current = onHand;

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: { detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks?: { x: number; y: number }[][] }; close: () => void } | null =
      null;
    let lastVideoTime = -1;

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
          setErrorMsg(
            (e as Error)?.message ?? "Camera or model unavailable"
          );
        }
      }
    }

    function loop() {
      const video = videoRef.current;
      if (!video || !landmarker) return;
      if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
        lastVideoTime = video.currentTime;
        const res = landmarker.detectForVideo(video, performance.now());
        if (res.landmarks && res.landmarks.length > 0) {
          const hand = res.landmarks[0];
          const idx = hand[8]; // index fingertip
          const thumb = hand[4]; // thumb tip
          const dist = Math.hypot(idx.x - thumb.x, idx.y - thumb.y);
          const pinching = dist < 0.065;
          // Mirror X (selfie view); map normalized coords to the viewport.
          const x = (1 - idx.x) * window.innerWidth;
          const y = idx.y * window.innerHeight;
          onHandRef.current({ x, y }, pinching);
        } else {
          onHandRef.current(null, false);
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
