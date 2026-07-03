import { Dispatch, MutableRefObject, RefObject, SetStateAction, useEffect } from "react";
import { Camera } from "@/types/canvas";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;
const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

type Touchy = { clientX: number; clientY: number };
const dist = (a: Touchy, b: Touchy) =>
  Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
const mid = (a: Touchy, b: Touchy) => ({
  x: (a.clientX + b.clientX) / 2,
  y: (a.clientY + b.clientY) / 2,
});

/**
 * Two-finger pinch-to-zoom + pan for touch devices. Anchors the world point
 * under the initial finger midpoint, so the canvas zooms toward the pinch and
 * follows the fingers. Sets `pinchingRef` while active so pointer-based drawing
 * handlers can bail out.
 */
export function usePinchZoom(
  containerRef: RefObject<HTMLElement | null>,
  setCamera: Dispatch<SetStateAction<Camera>>,
  pinchingRef: MutableRefObject<boolean>,
  onPinchStart?: () => void
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startDist = 0;
    let startMid = { x: 0, y: 0 };
    let startCam: Camera | null = null;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      pinchingRef.current = true;
      startDist = dist(e.touches[0], e.touches[1]) || 1;
      startMid = mid(e.touches[0], e.touches[1]);
      // Snapshot the live camera without mutating it.
      setCamera((c) => {
        startCam = c;
        return c;
      });
      onPinchStart?.();
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !startCam) return;
      e.preventDefault();
      const d = dist(e.touches[0], e.touches[1]);
      const m = mid(e.touches[0], e.touches[1]);
      const base = startCam;
      const zoom = clamp(base.zoom * (d / startDist));
      // World point under the initial midpoint stays glued to the fingers.
      const wx = (startMid.x - base.x) / base.zoom;
      const wy = (startMid.y - base.y) / base.zoom;
      setCamera({ x: m.x - wx * zoom, y: m.y - wy * zoom, zoom });
    };

    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchingRef.current = false;
        startCam = null;
      }
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [containerRef, setCamera, pinchingRef, onPinchStart]);
}
