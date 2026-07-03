"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { Camera } from "@/types/canvas";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface Slide {
  id: string;
  title?: string;
  bounds: { x: number; y: number; width: number; height: number };
}

interface PresentationOverlayProps {
  slides: Slide[];
  setCamera: Dispatch<SetStateAction<Camera>>;
  onExit: () => void;
}

/** Camera that fits a frame's bounds centred in the viewport. */
function fitCamera(b: Slide["bounds"], pad = 0.12): Camera {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const zoom = Math.max(
    0.05,
    Math.min(vw / (b.width * (1 + pad)), vh / (b.height * (1 + pad)))
  );
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  return { x: vw / 2 - cx * zoom, y: vh / 2 - cy * zoom, zoom };
}

export function PresentationOverlay({
  slides,
  setCamera,
  onExit,
}: PresentationOverlayProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback(
    (i: number) => setIndex((prev) => Math.min(count - 1, Math.max(0, i ?? prev))),
    [count]
  );

  // Move the camera to the current slide.
  useEffect(() => {
    const slide = slides[index];
    if (slide) setCamera(fitCamera(slide.bounds));
  }, [index, slides, setCamera]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, onExit]);

  const slide = slides[index];

  return (
    <>
      {/* Frame everything outside the current slide with a subtle vignette. */}
      <div className="pointer-events-none fixed inset-0 z-30 ring-[3px] ring-inset ring-indigo-500/40" />

      {slide?.title && (
        <div className="fixed top-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-sm font-medium text-white shadow-lg">
          {slide.title}
        </div>
      )}

      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full bg-neutral-900/90 px-2 py-1.5 text-white shadow-xl">
        <button
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="rounded-full p-2 hover:bg-white/10 disabled:opacity-40"
          title="Previous (←)"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-[52px] text-center text-sm tabular-nums">
          {index + 1} / {count}
        </span>
        <button
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          className="rounded-full p-2 hover:bg-white/10 disabled:opacity-40"
          title="Next (→)"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="mx-1 h-6 w-px bg-white/20" />
        <button
          onClick={onExit}
          className="flex items-center gap-1 rounded-full px-3 py-2 text-sm hover:bg-white/10"
          title="Exit (Esc)"
        >
          <X className="h-4 w-4" /> Exit
        </button>
      </div>
    </>
  );
}
