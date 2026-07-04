"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import {
  Camera,
  CanvasMode,
  CanvasState,
  Color,
  InsertableLayerType,
  Layer,
  LayerStyle,
  LayerType,
  Point,
  Side,
  XYWH,
} from "@/types/canvas";
import {
  boundsFromDrag,
  colorToCss,
  finalInsertBounds,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayer,
  pointInLayer,
  pointInPolygon,
  pointerEventToCanvasPoint,
  resizeBounds,
  zoomCamera,
} from "@/lib/utils";
import { useLocalBoard } from "@/hooks/use-local-board";
import { stashImport } from "@/lib/guest-handoff";
import { saveGuestBoard } from "@/app/actions/board";
import type { PositionedLayer } from "@/lib/flowchart-layout";
import { Button } from "@/components/ui/button";
import Toolbar from "@/app/board/[boardId]/_components/toolbar";
import { LayerRenderer } from "@/app/board/[boardId]/_components/layer-renderer";
import { Path, strokeWidthToSize } from "@/app/board/[boardId]/_components/path";
import { BottomBar } from "@/components/canvas/bottom-bar";
import {
  PropertiesPanel,
  type StyleTarget,
} from "@/components/canvas/properties-panel";
import { DEFAULT_STYLE } from "@/lib/style";
import { CanvasMenu } from "@/components/canvas/canvas-menu";
import { OnboardingTour } from "@/components/canvas/onboarding-tour";
import { MoreToolsMenu } from "@/components/canvas/more-tools-menu";
import { HandDrawController } from "@/components/canvas/hand-draw";
import { WireframeDialog } from "@/components/canvas/wireframe-dialog";
import { recognizeStroke, buildRecognizedLayer } from "@/lib/beautify";
import { CollaborationDialog } from "@/components/canvas/collaboration-dialog";
import {
  PresentationOverlay,
  type Slide,
} from "@/components/canvas/presentation";
import { CommandPalette } from "@/components/canvas/command-palette";
import { buildPaletteGroups } from "@/lib/canvas-commands";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { newGuestRoomId, setGuestName } from "@/lib/collab";
import { requestTextFocus } from "@/lib/text-focus";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { Sparkles } from "lucide-react";
import {
  pickImageFile,
  readImageFile,
  imageBounds,
  type LoadedImage,
} from "@/lib/image-insert";
import { Share2 } from "lucide-react";
import { exportPng, exportSvg, canvasToPngDataUrl } from "@/lib/canvas-export";

const MAX_LAYERS = 100;
const SELECTION_COLOR = "#3b82f6";

function boundingBox(layers: Layer[]): XYWH | null {
  const first = layers[0];
  if (!first) return null;
  let left = first.x;
  let right = first.x + first.width;
  let top = first.y;
  let bottom = first.y + first.height;
  for (let i = 1; i < layers.length; i++) {
    const { x, y, width, height } = layers[i];
    if (left > x) left = x;
    if (right < x + width) right = x + width;
    if (top > y) top = y;
    if (bottom < y + height) bottom = y + height;
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export const GuestBoard = () => {
  const board = useLocalBoard();
  const router = useRouter();
  const { status } = useSession();
  const { resolvedTheme, setTheme } = useTheme();

  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({ r: 0, g: 0, b: 0 });
  const [selection, setSelection] = useState<string[]>([]);
  const [pencilDraft, setPencilDraft] = useState<number[][] | null>(null);
  const [shapeDraft, setShapeDraft] = useState<{
    layerType: InsertableLayerType;
    origin: Point;
    current: Point;
  } | null>(null);
  const [laserTrail, setLaserTrail] = useState<
    { x: number; y: number; t: number }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [style, setStyle] = useState<LayerStyle>(DEFAULT_STYLE);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [handMode, setHandMode] = useState(false);
  const [handCursor, setHandCursor] = useState<{ x: number; y: number } | null>(
    null
  );
  const [wireframeOpen, setWireframeOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const prevPinchRef = useRef(false);
  const historyPushed = useRef(false);

  const containerRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    camX: number;
    camY: number;
  } | null>(null);
  const spaceRef = useRef(false);
  const pinchingRef = useRef(false);

  usePinchZoom(containerRef, setCamera, pinchingRef, () => {
    setShapeDraft(null);
    setPencilDraft(null);
  });

  const { present, mutate, mutateLive, pushHistory } = board;
  const layerIds = present.layerIds;

  const layersMap = useMemo(
    () => new Map(Object.entries(present.layers)),
    [present.layers]
  );

  const selectionBounds = useMemo(() => {
    const layers = selection
      .map((id) => present.layers[id])
      .filter(Boolean) as Layer[];
    return boundingBox(layers);
  }, [selection, present.layers]);

  const soleSelectedType =
    selection.length === 1 ? present.layers[selection[0]]?.type : undefined;

  // ── Mutations ──────────────────────────────────────────────────────
  const insertLayer = useCallback(
    (layerType: InsertableLayerType, bounds: XYWH) => {
      if (layerIds.length >= MAX_LAYERS) return;
      const id = nanoid();
      const layer = {
        type: layerType,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        ...style,
        fill: style.stroke ?? lastUsedColor,
      } as Layer;
      mutate((prev) => ({
        layers: { ...prev.layers, [id]: layer },
        layerIds: [...prev.layerIds, id],
      }));
      setSelection([id]);
      if (layerType === LayerType.Text || layerType === LayerType.Note) {
        requestTextFocus(id);
      }
    },
    [layerIds.length, lastUsedColor, mutate, style]
  );

  const canvasCenter = useCallback(
    () => ({
      x: (window.innerWidth / 2 - camera.x) / camera.zoom,
      y: (window.innerHeight / 2 - camera.y) / camera.zoom,
    }),
    [camera]
  );

  const insertImage = useCallback(
    (img: LoadedImage, center: { x: number; y: number }) => {
      if (layerIds.length >= MAX_LAYERS) return;
      const b = imageBounds(img, center);
      const id = nanoid();
      const layer = {
        type: LayerType.Image,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        fill: { r: 0, g: 0, b: 0 },
        url: img.url,
      } as Layer;
      mutate((prev) => ({
        layers: { ...prev.layers, [id]: layer },
        layerIds: [...prev.layerIds, id],
      }));
      setSelection([id]);
    },
    [layerIds.length, mutate]
  );

  const onInsertImage = useCallback(async () => {
    const img = await pickImageFile();
    if (img) insertImage(img, canvasCenter());
  }, [insertImage, canvasCenter]);

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((i) => i.type.startsWith("image/"))
        ?.getAsFile();
      if (!file) return;
      e.preventDefault();
      const img = await readImageFile(file);
      insertImage(img, canvasCenter());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [insertImage, canvasCenter]);

  const applyStyleToSelection = useCallback(
    (partial: Partial<LayerStyle> & { fill?: Color }) => {
      if (!selection.length) return;
      mutate((prev) => {
        const layers = { ...prev.layers };
        for (const id of selection) {
          const l = layers[id];
          if (l) layers[id] = { ...l, ...partial } as Layer;
        }
        return { ...prev, layers };
      });
    },
    [selection, mutate]
  );

  const changeZOrder = useCallback(
    (dir: "front" | "back" | "forward" | "backward") => {
      if (!selection.length) return;
      const sel = new Set(selection);
      mutate((prev) => {
        const ids = [...prev.layerIds];
        const n = ids.length;
        if (dir === "front") {
          const kept = ids.filter((id) => !sel.has(id));
          return { ...prev, layerIds: [...kept, ...ids.filter((id) => sel.has(id))] };
        }
        if (dir === "back") {
          const kept = ids.filter((id) => !sel.has(id));
          return { ...prev, layerIds: [...ids.filter((id) => sel.has(id)), ...kept] };
        }
        if (dir === "forward") {
          for (let i = n - 2; i >= 0; i--) {
            if (sel.has(ids[i]) && !sel.has(ids[i + 1])) {
              [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]];
            }
          }
        } else {
          for (let i = 1; i < n; i++) {
            if (sel.has(ids[i]) && !sel.has(ids[i - 1])) {
              [ids[i], ids[i - 1]] = [ids[i - 1], ids[i]];
            }
          }
        }
        return { ...prev, layerIds: ids };
      });
    },
    [selection, mutate]
  );

  const eraseLayer = useCallback(
    (id: string) => {
      mutate((prev) => {
        if (!prev.layers[id]) return prev;
        const layers = { ...prev.layers };
        delete layers[id];
        return { layers, layerIds: prev.layerIds.filter((l) => l !== id) };
      });
      setSelection((s) => s.filter((l) => l !== id));
    },
    [mutate]
  );

  const eraseAtPoint = useCallback(
    (point: Point) => {
      const ids = present.layerIds;
      for (let i = ids.length - 1; i >= 0; i--) {
        const layer = present.layers[ids[i]];
        if (layer && pointInLayer(point, layer)) {
          eraseLayer(ids[i]);
          break;
        }
      }
    },
    [present, eraseLayer]
  );

  const translateSelectedLayers = useCallback(
    (point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) return;
      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };
      if (!historyPushed.current) {
        pushHistory();
        historyPushed.current = true;
      }
      mutateLive((prev) => {
        const layers = { ...prev.layers };
        for (const id of selection) {
          const l = layers[id];
          if (l) layers[id] = { ...l, x: l.x + offset.x, y: l.y + offset.y };
        }
        return { ...prev, layers };
      });
      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState, selection, mutateLive, pushHistory]
  );

  const resizeSelectedLayer = useCallback(
    (point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) return;
      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point
      );
      if (!historyPushed.current) {
        pushHistory();
        historyPushed.current = true;
      }
      mutateLive((prev) => {
        const id = selection[0];
        const l = prev.layers[id];
        if (!l) return prev;
        return { ...prev, layers: { ...prev.layers, [id]: { ...l, ...bounds } } };
      });
    },
    [canvasState, selection, mutateLive, pushHistory]
  );

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      historyPushed.current = false;
      setCanvasState({ mode: CanvasMode.Resizing, initialBounds, corner });
    },
    []
  );

  const insertPath = useCallback(() => {
    if (pencilDraft == null || pencilDraft.length < 2) {
      setPencilDraft(null);
      return;
    }
    const layer = penPointsToPathLayer(pencilDraft, lastUsedColor, {
      strokeWidth: style.strokeWidth,
      opacity: style.opacity,
    });
    const id = nanoid();
    mutate((prev) => ({
      layers: { ...prev.layers, [id]: layer as Layer },
      layerIds: [...prev.layerIds, id],
    }));
    setPencilDraft(null);
    setCanvasState({ mode: CanvasMode.Pencil });
  }, [pencilDraft, lastUsedColor, style, mutate]);

  // Finish a hand-drawn stroke: clean it up / snap to a shape, then insert.
  const commitHandStroke = useCallback(
    (draft: number[][] | null) => {
      if (draft == null || draft.length < 2) {
        setPencilDraft(null);
        return;
      }
      const desc = recognizeStroke(draft);
      const layer = buildRecognizedLayer(desc, style, lastUsedColor);
      const id = nanoid();
      mutate((prev) => ({
        layers: { ...prev.layers, [id]: layer },
        layerIds: [...prev.layerIds, id],
      }));
      setPencilDraft(null);
    },
    [style, lastUsedColor, mutate]
  );

  const handleHand = useCallback(
    (screen: { x: number; y: number } | null, pinching: boolean) => {
      if (!screen) {
        if (prevPinchRef.current) {
          commitHandStroke(pencilDraft);
          prevPinchRef.current = false;
        }
        setHandCursor(null);
        return;
      }
      setHandCursor(screen);
      const point = {
        x: (screen.x - camera.x) / camera.zoom,
        y: (screen.y - camera.y) / camera.zoom,
      };
      if (pinching && !prevPinchRef.current) {
        setPencilDraft([[point.x, point.y, 0.5]]);
      } else if (pinching && prevPinchRef.current) {
        setPencilDraft((prev) =>
          prev ? [...prev, [point.x, point.y, 0.5]] : [[point.x, point.y, 0.5]]
        );
      } else if (!pinching && prevPinchRef.current) {
        commitHandStroke(pencilDraft);
      }
      prevPinchRef.current = pinching;
    },
    [camera, commitHandStroke, pencilDraft]
  );

  const deleteSelected = useCallback(() => {
    if (!selection.length) return;
    mutate((prev) => {
      const layers = { ...prev.layers };
      selection.forEach((id) => delete layers[id]);
      return {
        layers,
        layerIds: prev.layerIds.filter((id) => !selection.includes(id)),
      };
    });
    setSelection([]);
  }, [selection, mutate]);

  const updateValue = useCallback(
    (id: string, value: string) => {
      mutateLive((prev) => {
        const l = prev.layers[id];
        if (!l) return prev;
        return { ...prev, layers: { ...prev.layers, [id]: { ...l, value } } };
      });
    },
    [mutateLive]
  );

  const insertFlowchart = useCallback(
    (items: PositionedLayer[]) => {
      mutate((prev) => {
        const layers = { ...prev.layers };
        const ids = [...prev.layerIds];
        for (const { id, layer } of items) {
          if (ids.length >= MAX_LAYERS) break;
          layers[id] = layer;
          ids.push(id);
        }
        return { layers, layerIds: ids };
      });
    },
    [mutate]
  );

  const replaceFlowchart = useCallback(
    (prevIds: string[], items: PositionedLayer[]) => {
      mutate((prev) => {
        const layers = { ...prev.layers };
        for (const id of prevIds) delete layers[id];
        const ids = prev.layerIds.filter((id) => !prevIds.includes(id));
        for (const { id, layer } of items) {
          layers[id] = layer;
          ids.push(id);
        }
        return { layers, layerIds: ids };
      });
      setSelection([]);
    },
    [mutate]
  );

  const insertEmbed = useCallback(
    (url: string, center: { x: number; y: number }) => {
      if (layerIds.length >= MAX_LAYERS) return;
      const id = nanoid();
      const w = 420;
      const h = 300;
      const layer = {
        type: LayerType.Embed,
        x: center.x - w / 2,
        y: center.y - h / 2,
        width: w,
        height: h,
        fill: { r: 255, g: 255, b: 255 },
        value: url,
      } as Layer;
      mutate((prev) => ({
        layers: { ...prev.layers, [id]: layer },
        layerIds: [...prev.layerIds, id],
      }));
      setSelection([id]);
    },
    [layerIds.length, mutate]
  );

  const lassoSelect = useCallback(
    (poly: number[][]) => {
      const ids: string[] = [];
      for (const id of present.layerIds) {
        const l = present.layers[id];
        if (!l) continue;
        const cx = l.x + l.width / 2;
        const cy = l.y + l.height / 2;
        if (pointInPolygon(cx, cy, poly)) ids.push(id);
      }
      setSelection(ids);
    },
    [present]
  );

  // ── Pointer handling ───────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setCamera((cam) =>
          zoomCamera(
            cam,
            { x: e.clientX, y: e.clientY },
            cam.zoom * (1 - e.deltaY * 0.001)
          )
        );
      } else {
        setCamera((cam) => ({
          ...cam,
          x: cam.x - e.deltaX,
          y: cam.y - e.deltaY,
        }));
      }
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, []);

  const zoomAtCenter = useCallback((factor: number, absolute?: number) => {
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setCamera((cam) => zoomCamera(cam, center, absolute ?? cam.zoom * factor));
  }, []);

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
    }
  }, []);

  const updateSelectionNet = useCallback(
    (current: Point, origin: Point) => {
      const ids = findIntersectingLayersWithRectangle(
        layerIds,
        layersMap,
        origin,
        current
      );
      setSelection(ids);
      setCanvasState({ mode: CanvasMode.SelectionNet, origin, current });
    },
    [layerIds, layersMap]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (pinchingRef.current) return;
      if (
        canvasState.mode === CanvasMode.Hand ||
        spaceRef.current ||
        e.button === 1
      ) {
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          camX: camera.x,
          camY: camera.y,
        };
        return;
      }
      const point = pointerEventToCanvasPoint(e, camera);
      if (canvasState.mode === CanvasMode.Laser) {
        setLaserTrail([{ x: point.x, y: point.y, t: Date.now() }]);
        return;
      }
      if (canvasState.mode === CanvasMode.Lasso) {
        setCanvasState({ mode: CanvasMode.Lasso, points: [[point.x, point.y]] });
        return;
      }
      if (canvasState.mode === CanvasMode.Eraser) {
        eraseAtPoint(point);
        return;
      }
      if (canvasState.mode === CanvasMode.Inserting) {
        setShapeDraft({
          layerType: canvasState.layerType,
          origin: point,
          current: point,
        });
        return;
      }
      if (canvasState.mode === CanvasMode.Pencil) {
        setPencilDraft([[point.x, point.y, e.pressure]]);
        return;
      }
      setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState, eraseAtPoint]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();

      if (pinchingRef.current) return;

      if (panRef.current) {
        const { startX, startY, camX, camY } = panRef.current;
        const cx = e.clientX;
        const cy = e.clientY;
        setCamera((cam) => ({
          ...cam,
          x: camX + (cx - startX),
          y: camY + (cy - startY),
        }));
        return;
      }

      const current = pointerEventToCanvasPoint(e, camera);
      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Inserting) {
        setShapeDraft((d) => (d ? { ...d, current } : d));
      } else if (canvasState.mode === CanvasMode.Eraser) {
        if (e.buttons === 1) eraseAtPoint(current);
      } else if (canvasState.mode === CanvasMode.Laser) {
        if (e.buttons === 1)
          setLaserTrail((tr) => [
            ...tr,
            { x: current.x, y: current.y, t: Date.now() },
          ]);
      } else if (canvasState.mode === CanvasMode.Lasso) {
        if (e.buttons === 1)
          setCanvasState({
            mode: CanvasMode.Lasso,
            points: [...canvasState.points, [current.x, current.y]],
          });
      } else if (
        canvasState.mode === CanvasMode.Pencil &&
        e.buttons === 1 &&
        pencilDraft != null
      ) {
        setPencilDraft((prev) =>
          prev ? [...prev, [current.x, current.y, e.pressure]] : prev
        );
      }
    },
    [
      camera,
      canvasState,
      pencilDraft,
      startMultiSelection,
      updateSelectionNet,
      translateSelectedLayers,
      resizeSelectedLayer,
      eraseAtPoint,
    ]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (panRef.current) {
        panRef.current = null;
        return;
      }
      const point = pointerEventToCanvasPoint(e, camera);
      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        setSelection([]);
        setCanvasState({ mode: CanvasMode.None });
      } else if (canvasState.mode === CanvasMode.Lasso) {
        if (canvasState.points.length > 2) lassoSelect(canvasState.points);
        setCanvasState({ mode: CanvasMode.None });
      } else if (
        canvasState.mode === CanvasMode.Hand ||
        canvasState.mode === CanvasMode.Eraser ||
        canvasState.mode === CanvasMode.Laser
      ) {
        // Tool stays selected.
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        const draft = shapeDraft;
        const bounds = draft
          ? finalInsertBounds(draft.layerType, draft.origin, draft.current)
          : finalInsertBounds(canvasState.layerType, point, point);
        insertLayer(canvasState.layerType, bounds);
        setShapeDraft(null);
        if (!locked) setCanvasState({ mode: CanvasMode.None });
      } else {
        setCanvasState({ mode: CanvasMode.None });
      }
      historyPushed.current = false;
    },
    [camera, canvasState, insertPath, insertLayer, shapeDraft, locked, lassoSelect]
  );

  const onLayerPointerDown = useCallback(
    (e: React.PointerEvent, layerId: string) => {
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      ) {
        return;
      }
      if (canvasState.mode === CanvasMode.Eraser) {
        e.stopPropagation();
        eraseLayer(layerId);
        return;
      }
      if (
        canvasState.mode === CanvasMode.Hand ||
        canvasState.mode === CanvasMode.Laser ||
        canvasState.mode === CanvasMode.Lasso ||
        spaceRef.current
      ) {
        return;
      }
      e.stopPropagation();
      const point = pointerEventToCanvasPoint(e, camera);
      if (!selection.includes(layerId)) setSelection([layerId]);
      historyPushed.current = false;
      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState.mode, camera, selection, eraseLayer]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const isEditing = (t: HTMLElement | null) =>
      !!t &&
      (t.isContentEditable ||
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA");

    const insert = (layerType: InsertableLayerType) =>
      setCanvasState({ mode: CanvasMode.Inserting, layerType });

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditing(e.target as HTMLElement)) return;

      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === "/" || k === "k") {
          e.preventDefault();
          setPaletteOpen((o) => !o);
        } else if (k === "=" || k === "+") {
          e.preventDefault();
          zoomAtCenter(1.2);
        } else if (k === "-") {
          e.preventDefault();
          zoomAtCenter(1 / 1.2);
        } else if (k === "z") {
          e.preventDefault();
          if (e.shiftKey) board.redo();
          else board.undo();
        } else if (k === "y") {
          e.preventDefault();
          board.redo();
        }
        return;
      }

      switch (e.key) {
        case "Delete":
        case "Backspace":
          deleteSelected();
          break;
        case " ":
          spaceRef.current = true;
          break;
        case "1":
        case "v":
          setCanvasState({ mode: CanvasMode.None });
          break;
        case "h":
          setCanvasState({ mode: CanvasMode.Hand });
          break;
        case "2":
        case "r":
          insert(LayerType.Rectangle);
          break;
        case "3":
        case "d":
          insert(LayerType.Diamond);
          break;
        case "4":
        case "o":
          insert(LayerType.Ellipse);
          break;
        case "5":
        case "a":
          insert(LayerType.Arrow);
          break;
        case "6":
        case "l":
          insert(LayerType.Line);
          break;
        case "7":
        case "p":
          setCanvasState({ mode: CanvasMode.Pencil });
          break;
        case "8":
        case "t":
          insert(LayerType.Text);
          break;
        case "9":
          insert(LayerType.Note);
          break;
        case "0":
        case "e":
          setCanvasState({ mode: CanvasMode.Eraser });
          break;
        case "k":
          setCanvasState({ mode: CanvasMode.Laser });
          break;
        case "f":
          insert(LayerType.Frame);
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        spaceRef.current = false;
        panRef.current = null;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [deleteSelected, board, zoomAtCenter]);

  useEffect(() => {
    if (canvasState.mode !== CanvasMode.Laser) {
      setLaserTrail((tr) => (tr.length ? [] : tr));
      return;
    }
    const id = setInterval(() => {
      setLaserTrail((tr) => {
        if (!tr.length) return tr;
        const now = Date.now();
        const kept = tr.filter((p) => now - p.t < 700);
        return kept.length === tr.length ? tr : kept;
      });
    }, 50);
    return () => clearInterval(id);
  }, [canvasState.mode]);

  // Start a live-collaboration session: spin up a public room seeded with the
  // current drawing and jump into it.
  const startSession = (name: string) => {
    setGuestName(name);
    const roomId = newGuestRoomId();
    stashImport(roomId, present);
    router.push(`/r/${roomId}`);
  };

  // ── Save on login ──────────────────────────────────────────────────
  const onSave = async () => {
    if (!layerIds.length) {
      toast.error("Draw something first!");
      return;
    }
    setSaving(true);
    try {
      const id = await saveGuestBoard({ title: "Untitled" });
      stashImport(id, present);
      board.clear();
      toast.success("Saved to your boards!");
      router.push(`/board/${id}`);
    } catch (err) {
      toast.error(
        (err as Error)?.message ?? "Failed to save whiteboard"
      );
      setSaving(false);
    }
  };

  const selectedLayer = selection.length
    ? present.layers[selection[0]]
    : null;
  const panelTarget: StyleTarget | null = selectedLayer
    ? (selectedLayer.type as StyleTarget)
    : canvasState.mode === CanvasMode.Inserting
      ? (canvasState.layerType as StyleTarget)
      : canvasState.mode === CanvasMode.Pencil
        ? "pencil"
        : null;
  const panelStyle: LayerStyle = selectedLayer
    ? {
        ...(selectedLayer as unknown as LayerStyle),
        stroke: selectedLayer.stroke ?? selectedLayer.fill,
      }
    : style;
  const onStyleChange = (partial: Partial<LayerStyle>) => {
    setStyle((s) => ({ ...s, ...partial }));
    if (partial.stroke) setLastUsedColor(partial.stroke);
    if (selection.length) applyStyleToSelection(partial);
  };

  // Frames = presentation slides, ordered top-to-bottom then left-to-right.
  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = [];
    for (const id of present.layerIds) {
      const l = present.layers[id];
      if (l && l.type === LayerType.Frame) {
        out.push({
          id,
          title: l.value,
          bounds: { x: l.x, y: l.y, width: l.width, height: l.height },
        });
      }
    }
    return out.sort(
      (a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x
    );
  }, [present.layers, present.layerIds]);

  const startPresenting = () => {
    if (!slides.length) {
      toast.error("Add a Frame (press F) to present — each frame is a slide.");
      return;
    }
    setPresenting(true);
  };

  const paletteGroups = buildPaletteGroups({
    setCanvasState,
    onExportPng: () => svgRef.current && exportPng(svgRef.current, bgColor),
    onExportSvg: () => svgRef.current && exportSvg(svgRef.current),
    onShare: () => setCollabOpen(true),
    onPresent: startPresenting,
    onImage: onInsertImage,
    onAi: () => setAiChatOpen(true),
    onWireframe: () => setWireframeOpen(true),
    onHandDraw: () => setHandMode(true),
    onReset: () => {
      board.clear();
      setSelection([]);
    },
    onHelp: () => window.dispatchEvent(new Event("softdraw:start-tour")),
    toggleTheme: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    zoomIn: () => zoomAtCenter(1.2),
    zoomOut: () => zoomAtCenter(1 / 1.2),
    zoomReset: () => zoomAtCenter(1, 1),
  });

  return (
    <main
      ref={containerRef}
      className="fixed inset-0 overflow-hidden touch-none select-none bg-neutral-100"
    >
      <div
        className="fixed inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#dadde2_1px,transparent_1px)] [background-size:16px_16px]"
        style={{ backgroundColor: bgColor }}
      />

      {presenting && (
        <PresentationOverlay
          slides={slides}
          setCamera={setCamera}
          onExit={() => setPresenting(false)}
        />
      )}
      {!presenting && (
      <>
      <CanvasMenu
        onExportPng={() => svgRef.current && exportPng(svgRef.current, bgColor)}
        onExportSvg={() => svgRef.current && exportSvg(svgRef.current)}
        onReset={() => {
          board.clear();
          setSelection([]);
        }}
        bgColor={bgColor}
        setBgColor={setBgColor}
        onInsert={insertFlowchart}
        onPresent={startPresenting}
        onShare={() => setCollabOpen(true)}
        onCommandPalette={() => setPaletteOpen(true)}
        onHelp={() => window.dispatchEvent(new Event("softdraw:start-tour"))}
        brand={{ subtitle: "Guest whiteboard — not saved" }}
        origin={() => ({
          x: (window.innerWidth / 2 - camera.x) / camera.zoom,
          y: (window.innerHeight / 2 - camera.y) / camera.zoom,
        })}
      />

      {/* Top bar (right-aligned actions; branding lives in the menu) */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        <div className="bg-white dark:bg-neutral-800 dark:text-neutral-100 rounded-md px-2 h-12 flex items-center gap-x-1 sm:gap-x-2 shadow-md">
          <Button
            variant="ghost"
            size="sm"
            className="text-indigo-500 hover:text-indigo-600 px-2"
            onClick={() => setCollabOpen(true)}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          {status === "authenticated" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/dashboard">My boards</Link>
              </Button>
              <Button size="sm" disabled={saving} onClick={onSave}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <Button size="sm" asChild disabled={status === "loading"}>
              <Link href="/sign-in?callbackUrl=/">Sign in to save</Link>
            </Button>
          )}
        </div>
      </div>

      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        locked={locked}
        setLocked={setLocked}
        moreMenu={
          <MoreToolsMenu
            canvasState={canvasState}
            setCanvasState={setCanvasState}
            onInsert={insertFlowchart}
            origin={() => ({
              x: (window.innerWidth / 2 - camera.x) / camera.zoom,
              y: (window.innerHeight / 2 - camera.y) / camera.zoom,
            })}
            onEmbed={(url) =>
              insertEmbed(url, {
                x: (window.innerWidth / 2 - camera.x) / camera.zoom,
                y: (window.innerHeight / 2 - camera.y) / camera.zoom,
              })
            }
            onHandDraw={() => setHandMode(true)}
            onWireframe={() => setWireframeOpen(true)}
            onImage={onInsertImage}
          />
        }
      />

      {handMode && (
        <HandDrawController
          onHand={handleHand}
          onClose={() => {
            handleHand(null, false);
            setHandMode(false);
          }}
        />
      )}
      {handMode && handCursor && (
        <div
          className="pointer-events-none fixed z-40 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500/80 shadow"
          style={{ left: handCursor.x, top: handCursor.y }}
        />
      )}
      <WireframeDialog
        open={wireframeOpen}
        onOpenChange={setWireframeOpen}
        capture={async () =>
          svgRef.current
            ? canvasToPngDataUrl(svgRef.current, bgColor)
            : null
        }
      />
      <CollaborationDialog
        open={collabOpen}
        onOpenChange={setCollabOpen}
        onStart={startSession}
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={paletteGroups}
      />

      <BottomBar
        zoom={camera.zoom}
        onZoomIn={() => zoomAtCenter(1.2)}
        onZoomOut={() => zoomAtCenter(1 / 1.2)}
        onZoomReset={() => zoomAtCenter(1, 1)}
        undo={board.undo}
        redo={board.redo}
        canUndo={board.canUndo}
        canRedo={board.canRedo}
      />

      {panelTarget != null && (
        <PropertiesPanel
          target={panelTarget}
          style={panelStyle}
          onChange={onStyleChange}
          hasSelection={selection.length > 0}
          onZOrder={changeZOrder}
          onDelete={deleteSelected}
        />
      )}

      <div
        data-tour="ai"
        className="hidden sm:block absolute bottom-3 left-1/2 -translate-x-1/2 z-10"
      >
        <Button
          onClick={() => setAiChatOpen(true)}
          className="shadow-md gap-x-2 bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:opacity-90 text-white"
        >
          <Sparkles className="h-4 w-4" /> Generate with AI
        </Button>
      </div>
      <AiChatPanel
        open={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        origin={() => ({
          x: (window.innerWidth / 2 - camera.x) / camera.zoom,
          y: (window.innerHeight / 2 - camera.y) / camera.zoom,
        })}
        onInsert={insertFlowchart}
        onReplace={replaceFlowchart}
      />
      <OnboardingTour />
      </>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          cursor:
            canvasState.mode === CanvasMode.Hand
              ? "grab"
              : canvasState.mode === CanvasMode.Eraser ||
                  canvasState.mode === CanvasMode.Laser ||
                  canvasState.mode === CanvasMode.Lasso
                ? "crosshair"
                : "default",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerDown={onPointerDown}
      >
        <g
          className="sd-canvas-content"
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          }}
        >
          {layerIds.map((id) => {
            const layer = present.layers[id];
            if (!layer) return null;
            return (
              <LayerRenderer
                key={id}
                id={id}
                layer={layer}
                onLayerPointerDown={onLayerPointerDown}
                selectionColor={
                  selection.includes(id) ? SELECTION_COLOR : undefined
                }
                onValueChange={updateValue}
              />
            );
          })}

          {/* Selection box + resize handles (single, non-path selection) */}
          {selectionBounds &&
            (() => {
              const z = camera.zoom || 1;
              const gap = 6 / z; // constant screen-space gap around the shape
              const sw = 1.5 / z; // constant stroke width
              const hs = 10 / z; // constant handle size
              const bx = selectionBounds.x - gap;
              const by = selectionBounds.y - gap;
              const bw = selectionBounds.width + gap * 2;
              const bh = selectionBounds.height + gap * 2;
              return (
                <>
                  <rect
                    className="fill-transparent stroke-blue-500 pointer-events-none"
                    x={bx}
                    y={by}
                    width={bw}
                    height={bh}
                    rx={6 / z}
                    strokeWidth={sw}
                  />
                  {selection.length === 1 &&
                    soleSelectedType !== LayerType.Path &&
                    (
                      [
                        { c: Side.Top + Side.Left, dx: 0, dy: 0, cur: "nwse-resize" },
                        { c: Side.Top, dx: 0.5, dy: 0, cur: "ns-resize" },
                        { c: Side.Top + Side.Right, dx: 1, dy: 0, cur: "nesw-resize" },
                        { c: Side.Right, dx: 1, dy: 0.5, cur: "ew-resize" },
                        { c: Side.Bottom + Side.Right, dx: 1, dy: 1, cur: "nwse-resize" },
                        { c: Side.Bottom, dx: 0.5, dy: 1, cur: "ns-resize" },
                        { c: Side.Bottom + Side.Left, dx: 0, dy: 1, cur: "nesw-resize" },
                        { c: Side.Left, dx: 0, dy: 0.5, cur: "ew-resize" },
                      ] as const
                    ).map((h, i) => (
                      <rect
                        key={i}
                        className="fill-white stroke-blue-500 drop-shadow-sm"
                        x={bx + bw * h.dx - hs / 2}
                        y={by + bh * h.dy - hs / 2}
                        width={hs}
                        height={hs}
                        rx={hs * 0.3}
                        strokeWidth={sw}
                        style={{ cursor: h.cur }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          onResizeHandlePointerDown(h.c, selectionBounds);
                        }}
                      />
                    ))}
                </>
              );
            })()}

          {canvasState.mode === CanvasMode.SelectionNet &&
            canvasState.current != null && (
              <rect
                className="fill-blue-500/5 stroke-blue-500 stroke-1"
                x={Math.min(canvasState.origin.x, canvasState.current.x)}
                y={Math.min(canvasState.origin.y, canvasState.current.y)}
                width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                height={Math.abs(canvasState.origin.y - canvasState.current.y)}
              />
            )}

          {shapeDraft && (
            <LayerRenderer
              id="shape-preview"
              layer={
                {
                  type: shapeDraft.layerType,
                  ...boundsFromDrag(
                    shapeDraft.layerType,
                    shapeDraft.origin,
                    shapeDraft.current
                  ),
                  fill: lastUsedColor,
                } as Layer
              }
              onLayerPointerDown={() => {}}
            />
          )}

          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorToCss(lastUsedColor)}
              x={0}
              y={0}
              size={strokeWidthToSize(style.strokeWidth)}
              opacity={style.opacity}
            />
          )}
          {laserTrail.map((p, i) =>
            i === 0 ? null : (
              <line
                key={i}
                x1={laserTrail[i - 1].x}
                y1={laserTrail[i - 1].y}
                x2={p.x}
                y2={p.y}
                stroke="#ef4444"
                strokeWidth={5 / camera.zoom}
                strokeLinecap="round"
                strokeOpacity={Math.max(0, 1 - (Date.now() - p.t) / 700)}
              />
            )
          )}
          {canvasState.mode === CanvasMode.Lasso &&
            canvasState.points.length > 1 && (
              <polygon
                points={canvasState.points.map((p) => p.join(",")).join(" ")}
                className="fill-blue-500/10 stroke-blue-500"
                strokeWidth={1.5 / camera.zoom}
                strokeDasharray={`${4 / camera.zoom} ${3 / camera.zoom}`}
              />
            )}
        </g>
      </svg>
    </main>
  );
};
