import { nanoid } from "nanoid";
import { LayerType, type Layer } from "@/types/canvas";
import type { PositionedLayer } from "@/lib/flowchart-layout";
import type { Presentation } from "@/app/actions/ai";

const W = 640;
const H = 400;
const GAP = 80;

/** Turn an AI presentation into laid-out Frame slides (each with title + body
 * text). Frames become slides in Present mode. */
export function presentationToLayers(
  deck: Presentation,
  origin: { x: number; y: number }
): PositionedLayer[] {
  const out: PositionedLayer[] = [];
  const total = deck.slides.length;
  const rowWidth = total * W + (total - 1) * GAP;
  const startX = origin.x - rowWidth / 2;
  const y = origin.y - H / 2;

  deck.slides.forEach((slide, i) => {
    const x = startX + i * (W + GAP);

    out.push({
      id: nanoid(),
      layer: {
        type: LayerType.Frame,
        x,
        y,
        width: W,
        height: H,
        fill: { r: 0, g: 0, b: 0 },
        value: slide.title || `Slide ${i + 1}`,
      } as Layer,
    });

    out.push({
      id: nanoid(),
      layer: {
        type: LayerType.Text,
        x: x + 32,
        y: y + 30,
        width: W - 64,
        height: 60,
        fill: { r: 17, g: 17, b: 17 },
        value: slide.title,
        fontSize: 32,
        fontFamily: "normal",
        textAlign: "left",
      } as Layer,
    });

    const body = slide.bullets.map((b) => `•  ${b}`).join("\n");
    out.push({
      id: nanoid(),
      layer: {
        type: LayerType.Text,
        x: x + 32,
        y: y + 110,
        width: W - 64,
        height: H - 150,
        fill: { r: 51, g: 51, b: 51 },
        value: body,
        fontSize: 22,
        fontFamily: "normal",
        textAlign: "left",
      } as Layer,
    });
  });

  return out;
}
