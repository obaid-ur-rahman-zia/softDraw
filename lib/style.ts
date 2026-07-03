import { Color, FontFamily, LayerStyle, StrokeStyle } from "@/types/canvas";
import { colorToCss } from "@/lib/utils";

// Universal defaults applied to new layers. Font/arrow specifics fall back
// inside their components so shape labels keep auto-sizing.
export const DEFAULT_STYLE: LayerStyle = {
  strokeWidth: 2,
  strokeStyle: "solid",
  fillStyle: "solid",
  roughness: 1,
  rounded: true,
  opacity: 100,
};

// Excalidraw-style swatches.
export const STROKE_PALETTE: Color[] = [
  { r: 30, g: 30, b: 30 }, // near-black
  { r: 224, g: 49, b: 49 }, // red
  { r: 47, g: 158, b: 68 }, // green
  { r: 26, g: 115, b: 232 }, // blue
  { r: 217, g: 119, b: 6 }, // orange
];

export const BG_PALETTE: (Color | null)[] = [
  null, // transparent
  { r: 255, g: 201, b: 201 }, // pink
  { r: 178, g: 242, b: 187 }, // green
  { r: 166, g: 216, b: 255 }, // blue
  { r: 255, g: 236, b: 153 }, // yellow
];

export function colorsEqual(a?: Color | null, b?: Color | null): boolean {
  if (!a || !b) return a == null && b == null;
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

export function hexToColor(hex: string): Color {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

/** Outline / line / text colour. */
export function resolveStroke(layer: { stroke?: Color; fill: Color }): string {
  return colorToCss(layer.stroke ?? layer.fill);
}

export function strokeDashArray(
  style: StrokeStyle | undefined,
  width: number
): string | undefined {
  if (style === "dashed") return `${width * 3} ${width * 2.5}`;
  if (style === "dotted") return `${width} ${width * 2}`;
  return undefined;
}

/** Tailwind class for a text font family (hand = Kalam applied by caller). */
export function fontFamilyClass(f?: FontFamily): string {
  if (f === "normal") return "font-sans";
  if (f === "code") return "font-mono";
  return ""; // "hand" — caller adds the Kalam className
}
