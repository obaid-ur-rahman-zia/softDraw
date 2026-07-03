import { getSvgPathFromStroke } from "@/lib/utils";
import getStroke from "perfect-freehand";
import React from "react";

interface PathProps {
  x: number;
  y: number;
  points: number[][];
  fill: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  stroke?: string;
  /** Freehand brush size (perfect-freehand). Defaults to 16. */
  size?: number;
  opacity?: number;
}

/** Map a stroke-width preset (1/2/4…) to a perfect-freehand brush size. */
export const strokeWidthToSize = (strokeWidth?: number) =>
  Math.max(2, (strokeWidth ?? 2) * 8);

export const Path = ({
  x,
  y,
  fill,
  points,
  onPointerDown,
  stroke,
  size = 16,
  opacity,
}: PathProps) => {
  return (
    <path
      className="drop-shadow-md"
      onPointerDown={onPointerDown}
      d={getSvgPathFromStroke(
        getStroke(points, {
          size,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        })
      )}
      style={{
        transform: `translate(
                    ${x}px,
                    ${y}px
                )`,
        opacity: opacity != null ? opacity / 100 : undefined,
      }}
      x={0}
      y={0}
      fill={fill}
      stroke={stroke}
      strokeWidth={1}
    />
  );
};
