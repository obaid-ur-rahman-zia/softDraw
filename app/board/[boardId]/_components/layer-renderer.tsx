"use client";

import { Layer, LayerType } from "@/types/canvas";
import { Text } from "./text";
import { Note } from "./note";
import { Path, strokeWidthToSize } from "./path";
import { RoughShape } from "./rough-shape";
import { Frame } from "./frame";
import { Embed } from "./embed";
import { colorToCss } from "@/lib/utils";

interface LayerRendererProps {
  id: string;
  layer: Layer;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
  /** When provided, editable layers (Text/Note/labeled shapes) become editable. */
  onValueChange?: (id: string, value: string) => void;
}

/**
 * Storage-agnostic renderer: given a plain Layer object, renders the right
 * shape. Shared by the collaborative canvas (Liveblocks-backed) and the guest
 * canvas (local-state-backed). Geometric shapes are drawn hand-sketched via
 * rough.js; Text/Note/Path keep their own rendering.
 */
export const LayerRenderer = ({
  id,
  layer,
  onLayerPointerDown,
  selectionColor,
  onValueChange,
}: LayerRendererProps) => {
  const onLabelChange = onValueChange
    ? (value: string) => onValueChange(id, value)
    : undefined;

  switch (layer.type) {
    case LayerType.Path:
      return (
        <Path
          key={id}
          points={layer.points}
          onPointerDown={(e) => onLayerPointerDown(e, id)}
          x={layer.x}
          y={layer.y}
          fill={colorToCss(layer.stroke ?? layer.fill)}
          stroke={selectionColor}
          size={strokeWidthToSize(layer.strokeWidth)}
          opacity={layer.opacity}
        />
      );
    case LayerType.Note:
      return (
        <Note
          id={id}
          layer={layer}
          onPointerDown={onLayerPointerDown}
          selectionColor={selectionColor}
          onValueChange={onLabelChange}
        />
      );
    case LayerType.Text:
      return (
        <Text
          id={id}
          layer={layer}
          onPointerDown={onLayerPointerDown}
          selectionColor={selectionColor}
          onValueChange={onLabelChange}
        />
      );
    case LayerType.Rectangle:
    case LayerType.Ellipse:
    case LayerType.Diamond:
    case LayerType.Triangle:
    case LayerType.Star:
    case LayerType.Line:
    case LayerType.Arrow:
      return (
        <RoughShape
          id={id}
          layer={layer}
          onLayerPointerDown={onLayerPointerDown}
          selectionColor={selectionColor}
          onValueChange={onValueChange}
        />
      );
    case LayerType.Frame:
      return (
        <Frame
          id={id}
          layer={layer}
          onPointerDown={onLayerPointerDown}
          selectionColor={selectionColor}
          onValueChange={onLabelChange}
        />
      );
    case LayerType.Embed:
      return (
        <Embed
          id={id}
          layer={layer}
          onPointerDown={onLayerPointerDown}
          selectionColor={selectionColor}
        />
      );
    default:
      console.warn("Unknown Layer Type");
      return null;
  }
};
