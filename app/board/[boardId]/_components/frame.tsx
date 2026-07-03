"use client";

import { FrameLayer } from "@/types/canvas";
import { cn } from "@/lib/utils";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";

interface FrameProps {
  id: string;
  layer: FrameLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
  onValueChange?: (value: string) => void;
}

export const Frame = ({
  id,
  layer,
  onPointerDown,
  selectionColor,
  onValueChange,
}: FrameProps) => {
  const { x, y, width, height, value } = layer;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      opacity={(layer.opacity ?? 100) / 100}
    >
      <foreignObject x={0} y={-22} width={Math.max(60, width)} height={20}>
        <div
          className="text-[12px] text-neutral-500 dark:text-neutral-400 w-fit max-w-full truncate cursor-move"
          onPointerDown={(e) => onPointerDown(e, id)}
        >
          <ContentEditable
            html={value || "Frame"}
            disabled={!onValueChange}
            onChange={(e: ContentEditableEvent) =>
              onValueChange?.(e.target.value)
            }
            className={cn(
              "outline-none select-none focus:select-text inline-block"
            )}
          />
        </div>
      </foreignObject>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={6}
        fill="rgba(120,130,150,0.04)"
        stroke={selectionColor || "#9aa0a6"}
        strokeWidth={selectionColor ? 3 : 1.5}
        onPointerDown={(e) => onPointerDown(e, id)}
      />
    </g>
  );
};
