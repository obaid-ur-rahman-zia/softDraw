import rough from "roughjs";
import type { Options } from "roughjs/bin/core";
import { Color, LayerStyle } from "@/types/canvas";
import { colorToCss } from "@/lib/utils";

type Gen = ReturnType<typeof rough.generator>;

let _gen: Gen | null = null;
export function generator(): Gen {
  if (!_gen) _gen = rough.generator();
  return _gen;
}

/** Stable per-shape seed so the sketch doesn't jitter across re-renders. */
export function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 2147483646) + 1;
}

// Sloppiness → rough roughness (architect / artist / cartoonist).
const ROUGHNESS = [0.5, 1.1, 2.6];

export function roughOptions(
  layer: LayerStyle & { fill: Color },
  id: string,
  selectionColor?: string
): Options {
  const sw = (layer.strokeWidth ?? 2) * 1.1;
  const opts: Options = {
    stroke: selectionColor || colorToCss(layer.stroke ?? layer.fill),
    strokeWidth: sw,
    roughness: ROUGHNESS[layer.roughness ?? 1] ?? 1.1,
    seed: seedFromId(id),
    bowing: 1,
    preserveVertices: false,
  };
  if (layer.strokeStyle === "dashed") opts.strokeLineDash = [sw * 4, sw * 3];
  else if (layer.strokeStyle === "dotted") opts.strokeLineDash = [sw, sw * 2.5];
  if (layer.bgColor) {
    opts.fill = colorToCss(layer.bgColor);
    opts.fillStyle = layer.fillStyle ?? "hachure";
    opts.fillWeight = Math.max(1, sw / 2);
    opts.hachureGap = sw * 4;
  }
  return opts;
}

export function roundedRectPath(w: number, h: number, r: number): string {
  const rad = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  return [
    `M ${rad} 0`,
    `L ${w - rad} 0`,
    `Q ${w} 0 ${w} ${rad}`,
    `L ${w} ${h - rad}`,
    `Q ${w} ${h} ${w - rad} ${h}`,
    `L ${rad} ${h}`,
    `Q 0 ${h} 0 ${h - rad}`,
    `L 0 ${rad}`,
    `Q 0 0 ${rad} 0`,
    "Z",
  ].join(" ");
}

export function starPolygon(w: number, h: number): [number, number][] {
  const cx = w / 2;
  const cy = h / 2;
  const outer = Math.min(w, h) / 2;
  const inner = outer * 0.4;
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return pts;
}
