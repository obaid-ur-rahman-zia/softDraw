import { CanvasMode, CanvasState, LayerType } from "@/types/canvas";
import type { PaletteGroup } from "@/components/canvas/command-palette";
import {
  MousePointer2,
  Hand,
  Square,
  Diamond,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  Minus,
  Pencil,
  Type,
  StickyNote,
  Eraser,
  Frame,
  Zap,
  ImageDown,
  FileCode,
  Share2,
  Play,
  ImagePlus,
  Sparkles,
  Moon,
  ZoomIn,
  ZoomOut,
  Maximize,
  Trash2,
  HelpCircle,
} from "lucide-react";

export interface CommandCtx {
  setCanvasState: (s: CanvasState) => void;
  onExportPng?: () => void;
  onExportSvg?: () => void;
  onShare?: () => void;
  onPresent?: () => void;
  onImage?: () => void;
  onAi?: () => void;
  onWireframe?: () => void;
  onHandDraw?: () => void;
  onReset?: () => void;
  onHelp?: () => void;
  toggleTheme?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  zoomReset?: () => void;
}

export function buildPaletteGroups(ctx: CommandCtx): PaletteGroup[] {
  const set = ctx.setCanvasState;
  const insert = (layerType: LayerType) =>
    set({ mode: CanvasMode.Inserting, layerType } as CanvasState);

  const tools: PaletteGroup = {
    heading: "Tools",
    items: [
      { id: "select", label: "Select", icon: MousePointer2, shortcut: "1", perform: () => set({ mode: CanvasMode.None }) },
      { id: "hand", label: "Hand (pan)", icon: Hand, shortcut: "H", perform: () => set({ mode: CanvasMode.Hand }) },
      { id: "rect", label: "Rectangle", icon: Square, shortcut: "2", perform: () => insert(LayerType.Rectangle) },
      { id: "diamond", label: "Diamond", icon: Diamond, shortcut: "3", perform: () => insert(LayerType.Diamond) },
      { id: "ellipse", label: "Ellipse", icon: Circle, shortcut: "4", perform: () => insert(LayerType.Ellipse) },
      { id: "triangle", label: "Triangle", icon: Triangle, perform: () => insert(LayerType.Triangle) },
      { id: "star", label: "Star", icon: Star, perform: () => insert(LayerType.Star) },
      { id: "arrow", label: "Arrow", icon: ArrowRight, shortcut: "5", perform: () => insert(LayerType.Arrow) },
      { id: "line", label: "Line", icon: Minus, shortcut: "6", perform: () => insert(LayerType.Line) },
      { id: "draw", label: "Draw (pen)", icon: Pencil, shortcut: "7", perform: () => set({ mode: CanvasMode.Pencil }) },
      { id: "text", label: "Text", icon: Type, shortcut: "8", perform: () => insert(LayerType.Text) },
      { id: "note", label: "Sticky note", icon: StickyNote, shortcut: "9", perform: () => insert(LayerType.Note) },
      { id: "frame", label: "Frame", icon: Frame, shortcut: "F", perform: () => insert(LayerType.Frame) },
      { id: "laser", label: "Laser pointer", icon: Zap, shortcut: "K", perform: () => set({ mode: CanvasMode.Laser }) },
      { id: "eraser", label: "Eraser", icon: Eraser, shortcut: "0", perform: () => set({ mode: CanvasMode.Eraser }) },
    ],
  };

  const actions: PaletteGroup = { heading: "Create & collaborate", items: [] };
  if (ctx.onImage) actions.items.push({ id: "image", label: "Insert image", icon: ImagePlus, perform: ctx.onImage, keywords: ["photo", "upload"] });
  if (ctx.onAi) actions.items.push({ id: "ai", label: "Generate diagram (AI)", icon: Sparkles, perform: ctx.onAi, keywords: ["flowchart", "erd", "class", "diagram"] });
  if (ctx.onWireframe) actions.items.push({ id: "wireframe", label: "Wireframe to code (AI)", icon: FileCode, perform: ctx.onWireframe, keywords: ["html", "generate"] });
  if (ctx.onHandDraw) actions.items.push({ id: "hand-draw", label: "Hand-gesture draw", icon: Hand, perform: ctx.onHandDraw, keywords: ["webcam", "camera", "gesture"] });
  if (ctx.onShare) actions.items.push({ id: "share", label: "Live collaboration", icon: Share2, perform: ctx.onShare, keywords: ["collaborate", "invite", "qr", "session"] });
  if (ctx.onPresent) actions.items.push({ id: "present", label: "Present frames", icon: Play, perform: ctx.onPresent, keywords: ["presentation", "slides"] });

  const canvas: PaletteGroup = { heading: "Canvas", items: [] };
  if (ctx.onExportPng) canvas.items.push({ id: "png", label: "Export image (PNG)", icon: ImageDown, shortcut: "⌘⇧E", perform: ctx.onExportPng });
  if (ctx.onExportSvg) canvas.items.push({ id: "svg", label: "Export as SVG", icon: FileCode, perform: ctx.onExportSvg });
  if (ctx.toggleTheme) canvas.items.push({ id: "theme", label: "Toggle dark mode", icon: Moon, perform: ctx.toggleTheme });
  if (ctx.zoomIn) canvas.items.push({ id: "zoomin", label: "Zoom in", icon: ZoomIn, perform: ctx.zoomIn });
  if (ctx.zoomOut) canvas.items.push({ id: "zoomout", label: "Zoom out", icon: ZoomOut, perform: ctx.zoomOut });
  if (ctx.zoomReset) canvas.items.push({ id: "zoomreset", label: "Reset zoom", icon: Maximize, perform: ctx.zoomReset });
  if (ctx.onHelp) canvas.items.push({ id: "help", label: "Help & tour", icon: HelpCircle, shortcut: "?", perform: ctx.onHelp });
  if (ctx.onReset) canvas.items.push({ id: "reset", label: "Reset the canvas", icon: Trash2, perform: ctx.onReset });

  return [tools, actions, canvas];
}
