"use client";

import { useMemo } from "react";
import {
  ArrowLayer,
  DiamondLayer,
  EllipseLayer,
  LayerType,
  LineLayer,
  RectangleLayer,
  StarLayer,
  TriangleLayer,
} from "@/types/canvas";
import {
  generator,
  roughOptions,
  roundedRectPath,
  starPolygon,
} from "@/lib/rough";
import { colorToCss, getContrastingTextColor } from "@/lib/utils";
import { ShapeLabel } from "./shape-label";

type RoughLayer =
  | RectangleLayer
  | EllipseLayer
  | DiamondLayer
  | TriangleLayer
  | StarLayer
  | LineLayer
  | ArrowLayer;

interface RoughShapeProps {
  id: string;
  layer: RoughLayer;
  onLayerPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
  onValueChange?: (id: string, value: string) => void;
}

function headPoints(tipX: number, tipY: number, angle: number, size: number) {
  const spread = 0.45;
  const p1x = tipX - size * Math.cos(angle - spread);
  const p1y = tipY - size * Math.sin(angle - spread);
  const p2x = tipX - size * Math.cos(angle + spread);
  const p2y = tipY - size * Math.sin(angle + spread);
  return `${tipX},${tipY} ${p1x},${p1y} ${p2x},${p2y}`;
}

export const RoughShape = ({
  id,
  layer,
  onLayerPointerDown,
  selectionColor,
  onValueChange,
}: RoughShapeProps) => {
  const { x, y, width: w, height: h } = layer;
  const gen = generator();

  const drawable = useMemo(() => {
    const opts = roughOptions(layer, id, selectionColor);
    switch (layer.type) {
      case LayerType.Rectangle:
        return layer.rounded === false
          ? gen.rectangle(0, 0, w, h, opts)
          : gen.path(roundedRectPath(w, h, 16), opts);
      case LayerType.Ellipse:
        return gen.ellipse(w / 2, h / 2, w, h, opts);
      case LayerType.Diamond:
        return gen.polygon(
          [
            [w / 2, 0],
            [w, h / 2],
            [w / 2, h],
            [0, h / 2],
          ],
          opts
        );
      case LayerType.Triangle:
        return gen.polygon(
          [
            [w / 2, 0],
            [w, h],
            [0, h],
          ],
          opts
        );
      case LayerType.Star:
        return gen.polygon(starPolygon(w, h), opts);
      case LayerType.Line:
      case LayerType.Arrow:
        return gen.linearPath(
          [
            [0, 0],
            [w, h],
          ],
          opts
        );
      default:
        return gen.rectangle(0, 0, w, h, opts);
    }
  }, [layer, id, selectionColor, gen, w, h]);

  const paths = useMemo(
    () => drawable.sets.map((set) => ({ type: set.type, d: gen.opsToPath(set) })),
    [drawable, gen]
  );

  const opts = drawable.options;
  const isConnector =
    layer.type === LayerType.Line || layer.type === LayerType.Arrow;
  const isLabeled =
    layer.type === LayerType.Rectangle ||
    layer.type === LayerType.Ellipse ||
    layer.type === LayerType.Diamond ||
    layer.type === LayerType.Triangle;

  const strokeColor = opts.stroke as string;
  const labelColor = layer.bgColor
    ? getContrastingTextColor(layer.bgColor)
    : colorToCss(layer.stroke ?? layer.fill);

  const theta = Math.atan2(h, w);
  const headSize = Math.max(14, (layer.strokeWidth ?? 2) * 1.1 * 5);
  const startHead =
    isConnector && (layer.startArrowhead ?? "none") !== "none";
  const endHead =
    layer.type === LayerType.Arrow
      ? (layer.endArrowhead ?? "arrow") !== "none"
      : layer.type === LayerType.Line
        ? (layer.endArrowhead ?? "none") !== "none"
        : false;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onPointerDown={(e) => onLayerPointerDown(e, id)}
      opacity={(layer.opacity ?? 100) / 100}
      className="drop-shadow-md"
    >
      {isConnector ? (
        <line x1={0} y1={0} x2={w} y2={h} stroke="transparent" strokeWidth={16} />
      ) : (
        <rect x={0} y={0} width={w} height={h} fill="transparent" />
      )}

      {paths.map((p, i) => {
        if (p.type === "fillPath") {
          return <path key={i} d={p.d} fill={opts.fill as string} stroke="none" />;
        }
        if (p.type === "fillSketch") {
          return (
            <path
              key={i}
              d={p.d}
              stroke={opts.fill as string}
              strokeWidth={opts.fillWeight}
              fill="none"
            />
          );
        }
        return (
          <path
            key={i}
            d={p.d}
            stroke={strokeColor}
            strokeWidth={opts.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={opts.strokeLineDash?.join(" ")}
          />
        );
      })}

      {endHead && (
        <polygon points={headPoints(w, h, theta, headSize)} fill={strokeColor} />
      )}
      {startHead && (
        <polygon
          points={headPoints(0, 0, theta + Math.PI, headSize)}
          fill={strokeColor}
        />
      )}

      {isLabeled && (
        <ShapeLabel
          width={w}
          height={layer.type === LayerType.Triangle ? h * 1.2 : h}
          value={layer.value}
          color={labelColor}
          onValueChange={
            onValueChange ? (v) => onValueChange(id, v) : undefined
          }
          fontSize={layer.fontSize}
          fontFamily={layer.fontFamily}
          textAlign={layer.textAlign}
        />
      )}
    </g>
  );
};
