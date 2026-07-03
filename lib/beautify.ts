import { penPointsToPathLayer } from "@/lib/utils";
import { Color, Layer, LayerStyle, LayerType } from "@/types/canvas";

type Pt = [number, number];

export type Recognized =
  | { kind: "line"; from: Pt; to: Pt }
  | {
      kind: "rect" | "ellipse" | "triangle" | "diamond";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | { kind: "path"; points: number[][] };

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function bbox(pts: Pt[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Perpendicular distance from p to the infinite line through a→b. */
function perpDist(p: Pt, a: Pt, b: Pt) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len;
}

/** Ramer–Douglas–Peucker polyline simplification. */
function rdp(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts.slice();
  let idx = -1;
  let max = 0;
  const a = pts[0];
  const b = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], a, b);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  if (max > eps && idx !== -1) {
    const left = rdp(pts.slice(0, idx + 1), eps);
    const right = rdp(pts.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [a, b];
}

/** Chaikin corner-cutting smoothing. */
function chaikin(pts: Pt[], iterations = 2): Pt[] {
  let out = pts;
  for (let it = 0; it < iterations; it++) {
    if (out.length < 3) break;
    const next: Pt[] = [out[0]];
    for (let i = 0; i < out.length - 1; i++) {
      const p = out[i];
      const q = out[i + 1];
      next.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25]);
      next.push([p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]);
    }
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

/** Snap a near-horizontal / near-vertical line to a perfect axis. */
function snapAxis(from: Pt, to: Pt): [Pt, Pt] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
  // near horizontal
  if (angle < 8 || angle > 172) {
    const y = (from[1] + to[1]) / 2;
    return [
      [from[0], y],
      [to[0], y],
    ];
  }
  // near vertical
  if (angle > 82 && angle < 98) {
    const x = (from[0] + to[0]) / 2;
    return [
      [x, from[1]],
      [x, to[1]],
    ];
  }
  return [from, to];
}

/** Average absolute deviation of points from the bbox-inscribed ellipse. */
function ellipseError(pts: Pt[], b: ReturnType<typeof bbox>) {
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const rx = b.width / 2 || 1;
  const ry = b.height / 2 || 1;
  let sum = 0;
  for (const [x, y] of pts) {
    const nx = (x - cx) / rx;
    const ny = (y - cy) / ry;
    sum += Math.abs(Math.hypot(nx, ny) - 1);
  }
  return (sum / pts.length) * ((rx + ry) / 2);
}

/** 4-corner shape: are corners closer to bbox edge-midpoints (diamond) than to bbox corners (rect)? */
function isDiamond(corners: Pt[], b: ReturnType<typeof bbox>) {
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const rectCorners: Pt[] = [
    [b.x, b.y],
    [b.x + b.width, b.y],
    [b.x + b.width, b.y + b.height],
    [b.x, b.y + b.height],
  ];
  const midPoints: Pt[] = [
    [cx, b.y],
    [b.x + b.width, cy],
    [cx, b.y + b.height],
    [b.x, cy],
  ];
  const nearest = (p: Pt, set: Pt[]) =>
    Math.min(...set.map((q) => dist(p, q)));
  let rectScore = 0;
  let diamondScore = 0;
  for (const c of corners) {
    rectScore += nearest(c, rectCorners);
    diamondScore += nearest(c, midPoints);
  }
  return diamondScore < rectScore;
}

function smoothPath(raw: number[][]): Recognized {
  const xy: Pt[] = raw.map((p) => [p[0], p[1]]);
  const b = bbox(xy);
  const diag = Math.hypot(b.width, b.height) || 1;
  // Light denoise then smooth.
  const simplified = rdp(xy, diag * 0.008);
  const smoothed = chaikin(simplified, 2);
  return { kind: "path", points: smoothed.map((p) => [p[0], p[1], 0.5]) };
}

/**
 * Turn a messy freehand stroke into a clean primitive when it clearly looks
 * like one (line / rectangle / ellipse / triangle / diamond); otherwise return
 * a smoothed path. Conservative: falls back to a path whenever unsure.
 */
export function recognizeStroke(raw: number[][]): Recognized {
  const xy: Pt[] = raw.map((p) => [p[0], p[1]]);
  if (xy.length < 4) return smoothPath(raw);

  const b = bbox(xy);
  const diag = Math.hypot(b.width, b.height);
  if (diag < 28) return smoothPath(raw);

  const closed = dist(xy[0], xy[xy.length - 1]) < diag * 0.25;

  // Open stroke that's basically straight → line.
  if (!closed) {
    let maxDev = 0;
    for (const p of xy) maxDev = Math.max(maxDev, perpDist(p, xy[0], xy[xy.length - 1]));
    if (maxDev < diag * 0.09) {
      const [from, to] = snapAxis(xy[0], xy[xy.length - 1]);
      return { kind: "line", from, to };
    }
    return smoothPath(raw);
  }

  // Closed stroke → polygon / ellipse recognition.
  let corners = rdp(xy, diag * 0.055);
  if (
    corners.length > 1 &&
    dist(corners[0], corners[corners.length - 1]) < diag * 0.12
  ) {
    corners = corners.slice(0, -1); // drop the closing duplicate
  }
  const n = corners.length;

  if (n === 3) return { kind: "triangle", ...b };
  if (n === 4) {
    return isDiamond(corners, b)
      ? { kind: "diamond", ...b }
      : { kind: "rect", ...b };
  }
  // Rounded / many-vertex closed shape → ellipse if it fits well.
  if (n >= 5 && ellipseError(xy, b) < diag * 0.1) {
    return { kind: "ellipse", ...b };
  }
  // A boxy many-corner shape → rectangle; else keep a smoothed path.
  if (n >= 4 && n <= 6) return { kind: "rect", ...b };
  return smoothPath(raw);
}

const SHAPE_TYPE = {
  rect: LayerType.Rectangle,
  ellipse: LayerType.Ellipse,
  triangle: LayerType.Triangle,
  diamond: LayerType.Diamond,
} as const;

/** Build a concrete Layer object from a recognized stroke. */
export function buildRecognizedLayer(
  desc: Recognized,
  style: LayerStyle,
  color: Color
): Layer {
  if (desc.kind === "path") {
    return penPointsToPathLayer(desc.points, color) as Layer;
  }
  if (desc.kind === "line") {
    return {
      type: LayerType.Line,
      x: desc.from[0],
      y: desc.from[1],
      width: desc.to[0] - desc.from[0],
      height: desc.to[1] - desc.from[1],
      ...style,
      fill: style.stroke ?? color,
    } as Layer;
  }
  return {
    type: SHAPE_TYPE[desc.kind],
    x: desc.x,
    y: desc.y,
    width: desc.width,
    height: desc.height,
    ...style,
    fill: style.stroke ?? color,
  } as Layer;
}
