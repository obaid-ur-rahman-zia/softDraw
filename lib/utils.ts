import {
  Camera,
  Color,
  Layer,
  LayerType,
  PathLayer,
  Point,
  Side,
  XYWH,
} from "@/types/canvas";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function connectionIdToColor(connectionId: number): string {
  return COLORS[connectionId % COLORS.length];
}

export function pointerEventToCanvasPoint(
  e: React.PointerEvent,
  camera: Camera
) {
  const zoom = camera.zoom || 1;
  return {
    x: (Math.round(e.clientX) - camera.x) / zoom,
    y: (Math.round(e.clientY) - camera.y) / zoom,
  };
}

/** Zoom around a screen anchor point, keeping the canvas point under it fixed. */
export function zoomCamera(
  camera: Camera,
  anchor: { x: number; y: number },
  nextZoom: number
): Camera {
  const zoom = Math.min(Math.max(nextZoom, 0.1), 20);
  const canvasX = (anchor.x - camera.x) / (camera.zoom || 1);
  const canvasY = (anchor.y - camera.y) / (camera.zoom || 1);
  return {
    zoom,
    x: anchor.x - canvasX * zoom,
    y: anchor.y - canvasY * zoom,
  };
}

/** Whether a canvas-space point lies within a layer's bounding box (for the eraser). */
export function pointInLayer(
  point: Point,
  layer: { x: number; y: number; width: number; height: number }
) {
  const minX = Math.min(layer.x, layer.x + layer.width);
  const maxX = Math.max(layer.x, layer.x + layer.width);
  const minY = Math.min(layer.y, layer.y + layer.height);
  const maxY = Math.max(layer.y, layer.y + layer.height);
  const pad = 6;
  return (
    point.x >= minX - pad &&
    point.x <= maxX + pad &&
    point.y >= minY - pad &&
    point.y <= maxY + pad
  );
}

export function colorToCss(color: Color) {
  return `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
}

export function resizeBounds(bounds: XYWH, corner: Side, point: Point): XYWH {
  const result = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };

  if ((corner & Side.Left) === Side.Left) {
    result.x = Math.min(point.x, bounds.x + bounds.width);
    result.width = Math.abs(bounds.x + bounds.width - point.x);
  }

  if ((corner & Side.Right) === Side.Right) {
    result.x = Math.min(point.x, bounds.x);
    result.width = Math.abs(point.x - bounds.x);
  }

  if ((corner & Side.Top) === Side.Top) {
    result.y = Math.min(point.y, bounds.y + bounds.height);
    result.height = Math.abs(bounds.y + bounds.height - point.y);
  }

  if ((corner & Side.Bottom) === Side.Bottom) {
    result.y = Math.min(point.y, bounds.y);
    result.height = Math.abs(point.y - bounds.y);
  }

  return result;
}

export function findIntersectingLayersWithRectangle(
  layerIds: readonly string[],
  layers: ReadonlyMap<string, Layer>,
  a: Point,
  b: Point
) {
  const rect = {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };

  const ids = [];

  for (const layerId of layerIds) {
    const layer = layers.get(layerId);

    if (layer == null) {
      continue;
    }

    const { x, y, height, width } = layer;

    if (
      rect.x + rect.width > x &&
      rect.x < x + width &&
      rect.y + rect.height > y &&
      rect.y < y + height
    ) {
      ids.push(layerId);
    }
  }

  return ids;
}

/**
 * Live bounds while dragging a shape out (Excalidraw-style). Box shapes use the
 * normalized rectangle between the two points; connectors (Line/Arrow) keep the
 * signed vector from origin → current so direction is preserved.
 */
export function boundsFromDrag(
  layerType: LayerType,
  origin: Point,
  current: Point
): XYWH {
  const isConnector =
    layerType === LayerType.Line || layerType === LayerType.Arrow;
  if (isConnector) {
    return {
      x: origin.x,
      y: origin.y,
      width: current.x - origin.x,
      height: current.y - origin.y,
    };
  }
  return {
    x: Math.min(origin.x, current.x),
    y: Math.min(origin.y, current.y),
    width: Math.abs(current.x - origin.x),
    height: Math.abs(current.y - origin.y),
  };
}

/** Bounds to commit on pointer-up: the drag bounds, or a sensible default on a plain click. */
export function finalInsertBounds(
  layerType: LayerType,
  origin: Point,
  current: Point
): XYWH {
  const b = boundsFromDrag(layerType, origin, current);
  const tiny = Math.abs(b.width) < 5 && Math.abs(b.height) < 5;
  if (!tiny) return b;
  if (layerType === LayerType.Line || layerType === LayerType.Arrow)
    return { x: origin.x, y: origin.y, width: 160, height: 0 };
  if (layerType === LayerType.Frame)
    return { x: origin.x, y: origin.y, width: 320, height: 220 };
  return { x: origin.x, y: origin.y, width: 100, height: 100 };
}

/** Ray-casting point-in-polygon test (polygon = [[x,y], ...]). */
export function pointInPolygon(px: number, py: number, poly: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getContrastingTextColor(color: Color) {
  const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;

  return luminance > 182 ? "black" : "white";
}

export function penPointsToPathLayer(
  points: number[][],
  color: Color
): PathLayer {
  if (points.length < 2) {
    throw new Error("Cannot transform points with less than 2 points");
  }

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    const [x, y] = point;

    if (left > x) {
      left = x;
    }

    if (top > y) {
      top = y;
    }

    if (right < x) {
      right = x;
    }

    if (bottom < y) {
      bottom = y;
    }
  }

  return {
    type: LayerType.Path,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    fill: color,
    points: points.map(([x, y, pressure]) => [x - left, y - top, pressure]),
  };
}


export function getSvgPathFromStroke(stroke: number[][]) {
  if(!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");

  return d.join(" ");

}