"use client";

import { EmbedLayer } from "@/types/canvas";

interface EmbedProps {
  id: string;
  layer: EmbedLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

export const Embed = ({
  id,
  layer,
  onPointerDown,
  selectionColor,
}: EmbedProps) => {
  const { x, y, width, height, value } = layer;
  const url = value || "";

  return (
    <g transform={`translate(${x}, ${y})`} opacity={(layer.opacity ?? 100) / 100}>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={8}
        fill="#ffffff"
        stroke={selectionColor || "#d0d0d0"}
        strokeWidth={selectionColor ? 3 : 1.5}
      />
      <foreignObject x={0} y={0} width={width} height={height}>
        <div className="w-full h-full flex flex-col rounded-lg overflow-hidden">
          {/* Drag handle — click here to select/move the embed. */}
          <div
            className="h-6 shrink-0 bg-neutral-100 text-[10px] px-2 flex items-center text-neutral-500 truncate cursor-move select-none"
            onPointerDown={(e) => onPointerDown(e, id)}
          >
            {url || "Web embed"}
          </div>
          {url ? (
            <iframe
              src={url}
              title="embed"
              className="flex-1 w-full"
              style={{ border: 0 }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
              No URL set
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
};
