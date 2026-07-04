"use client";

import { useRef, useState } from "react";
import getStroke from "perfect-freehand";
import { getSvgPathFromStroke, cn } from "@/lib/utils";
import { Undo2, Trash2, Highlighter, Pen } from "lucide-react";

interface Stroke {
  pts: number[][];
  color: string;
  size: number;
  highlight: boolean;
}

const COLORS = [
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#111827",
  "#ffffff",
];
const SIZES = [4, 7, 12];

/** A full-screen transparent freehand annotator — used on the web and inside
 * the desktop (Electron) overlay to draw over anything on screen. */
export function ScreenDraw() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draft, setDraft] = useState<number[][] | null>(null);
  const [color, setColor] = useState("#ef4444");
  const [size, setSize] = useState(7);
  const [highlight, setHighlight] = useState(false);
  const drawing = useRef(false);

  const pathFor = (pts: number[][], sz: number) =>
    getSvgPathFromStroke(
      getStroke(pts, {
        size: sz,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.5,
      })
    );

  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    setDraft([[e.clientX, e.clientY, e.pressure || 0.5]]);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    setDraft((d) => (d ? [...d, [e.clientX, e.clientY, e.pressure || 0.5]] : d));
  };
  const up = () => {
    if (draft && draft.length > 1) {
      setStrokes((s) => [
        ...s,
        { pts: draft, color, size: highlight ? size * 2.5 : size, highlight },
      ]);
    }
    setDraft(null);
    drawing.current = false;
  };

  return (
    <div
      className="fixed inset-0 select-none"
      style={{ background: "transparent" }}
    >
      <svg
        className="h-full w-full"
        style={{ touchAction: "none" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      >
        {strokes.map((s, i) => (
          <path
            key={i}
            d={pathFor(s.pts, s.size)}
            fill={s.color}
            opacity={s.highlight ? 0.4 : 1}
          />
        ))}
        {draft && (
          <path
            d={pathFor(draft, highlight ? size * 2.5 : size)}
            fill={color}
            opacity={highlight ? 0.4 : 1}
          />
        )}
      </svg>

      {/* Floating toolbar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-neutral-900/90 px-3 py-2 text-white shadow-2xl backdrop-blur">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition",
              color === c ? "border-white scale-110" : "border-transparent"
            )}
            style={{ background: c }}
          />
        ))}
        <div className="mx-1 h-6 w-px bg-white/20" />
        {SIZES.map((w) => (
          <button
            key={w}
            onClick={() => setSize(w)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10",
              size === w && "bg-white/15"
            )}
          >
            <span
              className="rounded-full bg-white"
              style={{ width: w, height: w }}
            />
          </button>
        ))}
        <div className="mx-1 h-6 w-px bg-white/20" />
        <button
          onClick={() => setHighlight((h) => !h)}
          title="Highlighter"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10",
            highlight && "bg-white/15"
          )}
        >
          {highlight ? (
            <Highlighter className="h-4 w-4" />
          ) : (
            <Pen className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => setStrokes((s) => s.slice(0, -1))}
          title="Undo"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setStrokes([])}
          title="Clear all"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-red-500/30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
