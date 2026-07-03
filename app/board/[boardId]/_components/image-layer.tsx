"use client";

import { ImageLayer } from "@/types/canvas";

interface ImageShapeProps {
  id: string;
  layer: ImageLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

export const ImageShape = ({
  id,
  layer,
  onPointerDown,
  selectionColor,
}: ImageShapeProps) => {
  const { x, y, width, height, url } = layer;
  return (
    <g
      onPointerDown={(e) => onPointerDown(e, id)}
      opacity={(layer.opacity ?? 100) / 100}
      className="drop-shadow-md"
    >
      <image
        href={url}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="none"
      />
      {selectionColor && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke={selectionColor}
          strokeWidth={1}
        />
      )}
    </g>
  );
};
