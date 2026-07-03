import dagre from "@dagrejs/dagre";
import { nanoid } from "nanoid";
import { Color, Layer, LayerType } from "@/types/canvas";
import type { FlowchartGraph, NodeShape } from "@/app/actions/ai";

const COLORS: Record<NodeShape, Color> = {
  process: { r: 39, g: 142, b: 237 }, // blue
  decision: { r: 245, g: 159, b: 0 }, // amber
  terminal: { r: 47, g: 158, b: 68 }, // green
  database: { r: 132, g: 94, b: 247 }, // violet
  entity: { r: 22, g: 138, b: 173 }, // teal
};
const ARROW_COLOR: Color = { r: 73, g: 80, b: 87 };
const LABEL_COLOR: Color = { r: 73, g: 80, b: 87 };

export interface PositionedLayer {
  id: string;
  layer: Layer;
}

function measure(label: string, shape: NodeShape) {
  const lines = label.split(/\\n|\n/);
  const longest = Math.max(1, ...lines.map((l) => l.length));
  let w = Math.min(320, Math.max(120, longest * 8.5 + 36));
  let h = Math.max(60, lines.length * 22 + 22);
  if (shape === "decision") {
    w = Math.max(w, 140);
    h = Math.max(h, 96);
  }
  return { w, h };
}

function layerTypeFor(shape: NodeShape): LayerType {
  if (shape === "decision") return LayerType.Diamond;
  if (shape === "terminal") return LayerType.Ellipse;
  return LayerType.Rectangle;
}

/** Intersection of the ray (center → target) with the node's bounding box. */
function borderPoint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  tx: number,
  ty: number
) {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const scale = 1 / Math.max(Math.abs(dx) / (w / 2), Math.abs(dy) / (h / 2));
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function flowchartToLayers(
  graph: FlowchartGraph,
  origin: { x: number; y: number }
): PositionedLayer[] {
  const { nodes, edges } = graph;
  if (!nodes.length) return [];

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: graph.direction === "LR" ? "LR" : "TB",
    nodesep: 55,
    ranksep: 85,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const sizes = new Map<string, { w: number; h: number }>();
  for (const n of nodes) {
    const { w, h } = measure(n.label, n.shape);
    sizes.set(n.id, { w, h });
    g.setNode(n.id, { width: w, height: h });
  }
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const e of edges) {
    if (nodeIds.has(e.from) && nodeIds.has(e.to)) g.setEdge(e.from, e.to);
  }

  dagre.layout(g);

  const gw = g.graph().width ?? 0;
  const gh = g.graph().height ?? 0;
  const offX = origin.x - gw / 2;
  const offY = origin.y - gh / 2;

  const centers = new Map<
    string,
    { cx: number; cy: number; w: number; h: number }
  >();
  const nodeLayers: PositionedLayer[] = [];

  for (const n of nodes) {
    const dn = g.node(n.id);
    if (!dn) continue;
    const size = sizes.get(n.id)!;
    const cx = dn.x + offX;
    const cy = dn.y + offY;
    centers.set(n.id, { cx, cy, w: size.w, h: size.h });

    const multiline = /\\n|\n/.test(n.label);
    const value = n.label.replace(/\\n/g, "\n").replace(/\n/g, "<br>");
    const color = COLORS[n.shape] ?? COLORS.process;

    nodeLayers.push({
      id: nanoid(),
      layer: {
        type: layerTypeFor(n.shape),
        x: cx - size.w / 2,
        y: cy - size.h / 2,
        width: size.w,
        height: size.h,
        fill: color,
        stroke: color,
        bgColor: null,
        rounded: true,
        value,
        fontSize: multiline ? 13 : undefined,
        fontFamily: n.shape === "entity" ? "code" : "hand",
      } as Layer,
    });
  }

  const arrowLayers: PositionedLayer[] = [];
  const labelLayers: PositionedLayer[] = [];
  for (const e of edges) {
    const s = centers.get(e.from);
    const t = centers.get(e.to);
    if (!s || !t) continue;
    const a = borderPoint(s.cx, s.cy, s.w, s.h, t.cx, t.cy);
    const b = borderPoint(t.cx, t.cy, t.w, t.h, s.cx, s.cy);

    arrowLayers.push({
      id: nanoid(),
      layer: {
        type: LayerType.Arrow,
        x: a.x,
        y: a.y,
        width: b.x - a.x,
        height: b.y - a.y,
        fill: ARROW_COLOR,
        stroke: ARROW_COLOR,
      } as Layer,
    });

    if (e.label) {
      labelLayers.push({
        id: nanoid(),
        layer: {
          type: LayerType.Text,
          x: (a.x + b.x) / 2 - 34,
          y: (a.y + b.y) / 2 - 14,
          width: 68,
          height: 26,
          fill: LABEL_COLOR,
          stroke: LABEL_COLOR,
          value: e.label,
          fontSize: 14,
        } as Layer,
      });
    }
  }

  return [...arrowLayers, ...nodeLayers, ...labelLayers];
}
