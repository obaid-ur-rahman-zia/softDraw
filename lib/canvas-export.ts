import { toPng } from "html-to-image";

function download(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

/** Export the current canvas view as a PNG (foreground shapes + text). */
export async function exportPng(svg: SVGSVGElement, backgroundColor = "#ffffff") {
  const url = await toPng(svg as unknown as HTMLElement, {
    backgroundColor,
    pixelRatio: 2,
    width: svg.clientWidth || window.innerWidth,
    height: svg.clientHeight || window.innerHeight,
  });
  download(url, "softdraw.png");
}

/** Export the current canvas view as a standalone SVG file. */
export function exportSvg(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(svg.clientWidth || window.innerWidth));
  clone.setAttribute("height", String(svg.clientHeight || window.innerHeight));
  const data = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${data}`], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  download(url, "softdraw.svg");
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
