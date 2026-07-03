"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Info from "./info";
import Participants from "./participants";
import Toolbar from "./toolbar";
import {
  Camera,
  CanvasMode,
  CanvasState,
  Color,
  InsertableLayerType,
  Layer,
  LayerType,
  Point,
  Side,
  XYWH,
} from "@/types/canvas";
import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useOthersMapped,
  useSelf,
  useStorage,
} from "@/liveblocks.config";
import { CursorsPresence } from "./cursors-presence";
import {
  boundsFromDrag,
  colorToCss,
  connectionIdToColor,
  finalInsertBounds,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayer,
  pointInLayer,
  pointInPolygon,
  pointerEventToCanvasPoint,
  resizeBounds,
  zoomCamera,
} from "@/lib/utils";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import { LayerPreview } from "./layer-preview";
import { LayerRenderer } from "./layer-renderer";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Path, strokeWidthToSize } from "./path";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { takeImport } from "@/lib/guest-handoff";
import { AiFlowchartDialog } from "@/components/ai/ai-flowchart-dialog";
import type { PositionedLayer } from "@/lib/flowchart-layout";
import { BottomBar } from "@/components/canvas/bottom-bar";
import {
  PropertiesPanel,
  type StyleTarget,
} from "@/components/canvas/properties-panel";
import { DEFAULT_STYLE } from "@/lib/style";
import type { LayerStyle } from "@/types/canvas";
import { CanvasMenu } from "@/components/canvas/canvas-menu";
import { exportPng, exportSvg, canvasToPngDataUrl } from "@/lib/canvas-export";
import { useTheme } from "next-themes";
import { OnboardingTour } from "@/components/canvas/onboarding-tour";
import { MoreToolsMenu } from "@/components/canvas/more-tools-menu";
import { HandDrawController } from "@/components/canvas/hand-draw";
import { WireframeDialog } from "@/components/canvas/wireframe-dialog";
import { recognizeStroke, buildRecognizedLayer } from "@/lib/beautify";
import { requestTextFocus } from "@/lib/text-focus";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import {
  pickImageFile,
  readImageFile,
  imageBounds,
  type LoadedImage,
} from "@/lib/image-insert";
import { CollaborationDialog } from "@/components/canvas/collaboration-dialog";
import {
  PresentationOverlay,
  type Slide,
} from "@/components/canvas/presentation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Share2 } from "lucide-react";

interface CanvasProps {
  boardId: string;
  boardTitle: string;
  /** True when rendered as a public live-collaboration room (no saved board). */
  guest?: boolean;
}

const MAX_LAYERS = 100;

const Canvas = ({ boardId, boardTitle, guest = false }: CanvasProps) => {
  const router = useRouter();
  const [collabOpen, setCollabOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const layerIds = useStorage((root) => root.layerIds);

  const pencilDraft = useSelf((me) => me.presence.pencilDraft)

  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });

  // Keep the active tool selected after drawing (Excalidraw's lock).
  const [locked, setLocked] = useState(false);

  // Current style applied to new shapes (Excalidraw-style sticky styling).
  const [style, setStyle] = useState<LayerStyle>(DEFAULT_STYLE);

  const mySelection = useSelf((me) => me.presence.selection);
  const selectedLayer = useStorage((root) => {
    const id = mySelection?.[0];
    return id ? (root.layers.get(id) ?? null) : null;
  });

  // Flip the default drawing colour with the theme (only while untouched).
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    setLastUsedColor((c) => {
      const isDefault =
        (c.r === 0 && c.g === 0 && c.b === 0) ||
        (c.r === 255 && c.g === 255 && c.b === 255);
      if (!isDefault) return c;
      return resolvedTheme === "dark"
        ? { r: 255, g: 255, b: 255 }
        : { r: 0, g: 0, b: 0 };
    });
  }, [resolvedTheme]);

  // Excalidraw-style drag-to-draw draft for the shape being placed.
  const [shapeDraft, setShapeDraft] = useState<{
    layerType: InsertableLayerType;
    origin: Point;
    current: Point;
  } | null>(null);

  const [bgColor, setBgColor] = useState("");
  const [laserTrail, setLaserTrail] = useState<
    { x: number; y: number; t: number }[]
  >([]);
  const [handMode, setHandMode] = useState(false);
  const [handCursor, setHandCursor] = useState<{ x: number; y: number } | null>(
    null
  );
  const [wireframeOpen, setWireframeOpen] = useState(false);
  const prevPinchRef = useRef(false);

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

  const cancelDrafts = useMutation(({ setMyPresence }) => {
    setMyPresence({ pencilDraft: null });
  }, []);
  usePinchZoom(containerRef, setCamera, pinchingRef, () => {
    setShapeDraft(null);
    cancelDrafts();
  });

  useDisableScrollBounce()
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const insertLayer = useMutation(
    (
      { storage, setMyPresence },
      layerType: InsertableLayerType,
      bounds: XYWH
    ) => {
      const liveLayers = storage.get("layers");

      if (liveLayers.size >= MAX_LAYERS) {
        return;
      }

      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();
      const layer = new LiveObject<Layer>({
        type: layerType,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        ...style,
        fill: style.stroke ?? lastUsedColor,
      } as Layer);

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      if (layerType === LayerType.Text || layerType === LayerType.Note) {
        requestTextFocus(layerId);
      }
    },
    [lastUsedColor, style]
  );

  // Apply a style change to all currently-selected layers.
  const applyStyleToSelection = useMutation(
    ({ storage, self }, partial: Partial<LayerStyle> & { fill?: Color }) => {
      const liveLayers = storage.get("layers");
      for (const id of self.presence.selection) {
        liveLayers.get(id)?.update(partial as Partial<Layer>);
      }
    },
    []
  );

  const insertEmbed = useMutation(
    ({ storage, setMyPresence }, url: string, center: { x: number; y: number }) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) return;
      const liveLayerIds = storage.get("layerIds");
      const id = nanoid();
      const w = 420;
      const h = 300;
      liveLayers.set(
        id,
        new LiveObject<Layer>({
          type: LayerType.Embed,
          x: center.x - w / 2,
          y: center.y - h / 2,
          width: w,
          height: h,
          fill: { r: 255, g: 255, b: 255 },
          value: url,
        } as Layer)
      );
      liveLayerIds.push(id);
      setMyPresence({ selection: [id] }, { addToHistory: true });
    },
    []
  );

  const insertImage = useMutation(
    ({ storage, setMyPresence }, img: LoadedImage, center: { x: number; y: number }) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) return;
      const b = imageBounds(img, center);
      const id = nanoid();
      liveLayers.set(
        id,
        new LiveObject<Layer>({
          type: LayerType.Image,
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          fill: { r: 0, g: 0, b: 0 },
          url: img.url,
        } as Layer)
      );
      storage.get("layerIds").push(id);
      setMyPresence({ selection: [id] }, { addToHistory: true });
    },
    []
  );

  const canvasCenter = useCallback(
    () => ({
      x: (window.innerWidth / 2 - camera.x) / camera.zoom,
      y: (window.innerHeight / 2 - camera.y) / camera.zoom,
    }),
    [camera]
  );

  const onInsertImage = useCallback(async () => {
    const img = await pickImageFile();
    if (img) insertImage(img, canvasCenter());
  }, [insertImage, canvasCenter]);

  // Paste an image from the clipboard.
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

  const lassoSelect = useMutation(
    ({ storage, setMyPresence }, poly: number[][]) => {
      const liveLayers = storage.get("layers");
      const ids: string[] = [];
      for (const id of storage.get("layerIds").toImmutable()) {
        const l = liveLayers.get(id);
        if (!l) continue;
        const cx = l.get("x") + l.get("width") / 2;
        const cy = l.get("y") + l.get("height") / 2;
        if (pointInPolygon(cx, cy, poly)) ids.push(id);
      }
      setMyPresence({ selection: ids }, { addToHistory: true });
    },
    []
  );

  const resetCanvas = useMutation(({ storage, setMyPresence }) => {
    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    for (const id of liveLayerIds.toImmutable()) liveLayers.delete(id);
    while (liveLayerIds.length > 0) liveLayerIds.delete(0);
    setMyPresence({ selection: [] });
  }, []);

  const changeZOrder = useMutation(
    ({ storage, self }, dir: "front" | "back" | "forward" | "backward") => {
      const liveLayerIds = storage.get("layerIds");
      const sel = new Set(self.presence.selection);
      if (!sel.size) return;
      const arr = liveLayerIds.toImmutable();
      const n = arr.length;

      if (dir === "front") {
        const selected = arr.filter((id) => sel.has(id));
        for (const id of selected) {
          const from = liveLayerIds.indexOf(id);
          if (from !== -1) liveLayerIds.move(from, n - 1);
        }
      } else if (dir === "back") {
        const selected = arr.filter((id) => sel.has(id)).reverse();
        for (const id of selected) {
          const from = liveLayerIds.indexOf(id);
          if (from !== -1) liveLayerIds.move(from, 0);
        }
      } else if (dir === "forward") {
        for (let i = n - 2; i >= 0; i--) {
          if (sel.has(arr[i]) && !sel.has(arr[i + 1])) {
            const from = liveLayerIds.indexOf(arr[i]);
            if (from !== -1 && from < n - 1) liveLayerIds.move(from, from + 1);
          }
        }
      } else {
        for (let i = 1; i < n; i++) {
          if (sel.has(arr[i]) && !sel.has(arr[i - 1])) {
            const from = liveLayerIds.indexOf(arr[i]);
            if (from > 0) liveLayerIds.move(from, from - 1);
          }
        }
      }
    },
    []
  );

  // Eraser: delete a specific layer, or the topmost layer under a point.
  const eraseLayer = useMutation(({ storage }, id: string) => {
    storage.get("layers").delete(id);
    const ids = storage.get("layerIds");
    const idx = ids.indexOf(id);
    if (idx !== -1) ids.delete(idx);
  }, []);

  const eraseAtPoint = useMutation(({ storage }, point: Point) => {
    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    const arr = liveLayerIds.toImmutable();
    for (let i = arr.length - 1; i >= 0; i--) {
      const id = arr[i];
      const layer = liveLayers.get(id);
      if (!layer) continue;
      const b = {
        x: layer.get("x"),
        y: layer.get("y"),
        width: layer.get("width"),
        height: layer.get("height"),
      };
      if (pointInLayer(point, b)) {
        liveLayers.delete(id);
        const idx = liveLayerIds.indexOf(id);
        if (idx !== -1) liveLayerIds.delete(idx);
        break;
      }
    }
  }, []);

  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) {
        return;
      }

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const liveLayers = storage.get("layers");

      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);

        if (layer) {
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y,
          });
        }
      }

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState]
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      const layers = storage.get("layers").toImmutable();

      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });

      const ids = findIntersectingLayersWithRectangle(
        // @ts-expect-error: expecting
        layerIds,
        layers,
        origin,
        current
      );

      setMyPresence({ selection: ids });
    },
    [layerIds]
  );

  const startMutliSelection = useCallback((current: Point, origin: Point) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });
    }
  }, []);

  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
      const { pencilDraft } = self.presence;

      if (
        canvasState.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft == null
      ) {
        return;
      }

      setMyPresence({
        cursor: point,
        pencilDraft:
          pencilDraft.length === 1 &&
          pencilDraft[0][0] === point.x &&
          pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, e.pressure]],
      });
    },
    [canvasState.mode]
  );

  const insertPath = useMutation((
    { storage, self, setMyPresence }
  ) => {
    const liveLayers = storage.get("layers");

    const { pencilDraft } = self.presence

    if(
      pencilDraft == null ||
      pencilDraft.length < 2 ||
      liveLayers.size >= MAX_LAYERS
    ) {
      setMyPresence({ pencilDraft: null });
      return
    }

    const id = nanoid()

    liveLayers.set(
      id,
      new LiveObject(penPointsToPathLayer(
        pencilDraft,
        lastUsedColor,
        { strokeWidth: style.strokeWidth, opacity: style.opacity }
      ))
    )

    const liveLaterIds = storage.get("layerIds")
    liveLaterIds.push(id)

    setMyPresence({
      pencilDraft: null
    })

    setCanvasState({
      mode: CanvasMode.Pencil
    })

  }, [lastUsedColor, style])

  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        penColor: lastUsedColor,
      });
    },
    [lastUsedColor]
  );

  // Append a point to the current freehand draft (used by hand-gesture drawing).
  const handMove = useMutation(({ self, setMyPresence }, point: Point) => {
    const { pencilDraft } = self.presence;
    if (pencilDraft == null) return;
    setMyPresence({
      pencilDraft: [...pencilDraft, [point.x, point.y, 0.5]],
    });
  }, []);

  // Finish a hand-drawn stroke: clean it up / snap to a shape, then insert.
  const insertSmartPath = useMutation(
    ({ storage, self, setMyPresence }) => {
      const { pencilDraft } = self.presence;
      const liveLayers = storage.get("layers");
      if (
        pencilDraft == null ||
        pencilDraft.length < 2 ||
        liveLayers.size >= MAX_LAYERS
      ) {
        setMyPresence({ pencilDraft: null });
        return;
      }
      const desc = recognizeStroke(pencilDraft);
      const layer = buildRecognizedLayer(desc, style, lastUsedColor);
      const id = nanoid();
      liveLayers.set(id, new LiveObject(layer));
      storage.get("layerIds").push(id);
      setMyPresence({ pencilDraft: null });
    },
    [style, lastUsedColor]
  );

  const handleHand = useCallback(
    (screen: { x: number; y: number } | null, pinching: boolean) => {
      if (!screen) {
        if (prevPinchRef.current) {
          insertSmartPath();
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
        startDrawing(point, 0.5);
      } else if (pinching && prevPinchRef.current) {
        handMove(point);
      } else if (!pinching && prevPinchRef.current) {
        insertSmartPath();
      }
      prevPinchRef.current = pinching;
    },
    [camera, startDrawing, handMove, insertSmartPath]
  );

  // Seed a newly-created board from a guest whiteboard handoff (localStorage).
  const importGuestLayers = useMutation(
    (
      { storage },
      snapshot: { layers: Record<string, Layer>; layerIds: string[] }
    ) => {
      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");
      if (liveLayerIds.length > 0) return; // never clobber an existing board

      for (const id of snapshot.layerIds) {
        const layer = snapshot.layers[id];
        if (!layer) continue;
        liveLayers.set(id, new LiveObject(layer));
        liveLayerIds.push(id);
      }
    },
    []
  );

  const importedRef = useRef(false);
  useEffect(() => {
    if (importedRef.current) return;
    // Wait until Liveblocks storage is loaded (layerIds is null while loading),
    // otherwise the mutation throws "storage has not been loaded".
    if (layerIds == null) return;
    importedRef.current = true;
    const snapshot = takeImport(boardId);
    if (snapshot) importGuestLayers(snapshot);
  }, [boardId, importGuestLayers, layerIds]);

  // Bulk-insert AI-generated flowchart layers.
  const insertFlowchart = useMutation(
    ({ storage, setMyPresence }, items: PositionedLayer[]) => {
      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");
      for (const { id, layer } of items) {
        if (liveLayers.size >= MAX_LAYERS) break;
        liveLayers.set(id, new LiveObject(layer));
        liveLayerIds.push(id);
      }
      setMyPresence({ selection: [] });
    },
    []
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) {
        return;
      }

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point
      );

      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(self.presence.selection[0]);

      if (layer) {
        layer.update(bounds);
      }
    },
    [canvasState]
  );

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();
      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      });
    },
    [history]
  );

  // Ctrl/⌘ + wheel zooms toward the cursor; plain wheel pans.
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

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();

      // A two-finger pinch is in progress — the pinch hook owns the camera.
      if (pinchingRef.current) return;

      // Panning (hand tool or held space) — move the camera, skip everything else.
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
        startMutliSelection(current, canvasState.origin);
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
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }

      setMyPresence({ cursor: current });
    },
    [
      canvasState,
      continueDrawing,
      resizeSelectedLayer,
      camera,
      translateSelectedLayers,
      startMutliSelection,
      updateSelectionNet,
      eraseAtPoint,
    ]
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (pinchingRef.current) return;
      // Pan with the hand tool, held space, or middle mouse button.
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
        // Start dragging the shape out from this point.
        setShapeDraft({
          layerType: canvasState.layerType,
          origin: point,
          current: point,
        });
        return;
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState, setCanvasState, startDrawing, eraseAtPoint]
  );

  const onPointerUp = useMutation(
    ({}, e) => {
      // End a pan gesture.
      if (panRef.current) {
        panRef.current = null;
        return;
      }

      const point = pointerEventToCanvasPoint(e, camera);

      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        unselectLayers();

        setCanvasState({
          mode: CanvasMode.None,
        });
      } else if (canvasState.mode === CanvasMode.Lasso) {
        if (canvasState.points.length > 2) lassoSelect(canvasState.points);
        setCanvasState({ mode: CanvasMode.None });
      } else if (
        canvasState.mode === CanvasMode.Hand ||
        canvasState.mode === CanvasMode.Eraser ||
        canvasState.mode === CanvasMode.Laser
      ) {
        // Tool stays selected; nothing to commit on pointer-up.
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

      history.resume();
    },
    [
      camera,
      canvasState,
      history,
      insertLayer,
      unselectLayers,
      insertPath,
      setCanvasState,
      shapeDraft,
      locked,
      lassoSelect,
    ]
  );

  const selections = useOthersMapped((other) => other.presence.selection);

  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
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

      // Hand / laser / lasso / space-pan: don't select individual layers.
      if (
        canvasState.mode === CanvasMode.Hand ||
        canvasState.mode === CanvasMode.Laser ||
        canvasState.mode === CanvasMode.Lasso ||
        spaceRef.current
      ) {
        return;
      }

      history.pause();
      e.stopPropagation();

      const point = pointerEventToCanvasPoint(e, camera);

      if (!self.presence.selection.includes(layerId)) {
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      }

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [setCanvasState, history, camera, canvasState.mode, eraseLayer]
  );

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;

      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);


  const deleteLayers = useDeleteLayers()

  useEffect(() => {
    const isEditing = (t: HTMLElement | null) =>
      !!t &&
      (t.isContentEditable ||
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA");

    const insert = (layerType: InsertableLayerType) =>
      setCanvasState({ mode: CanvasMode.Inserting, layerType });

    function onKeyDown(e: KeyboardEvent) {
      if (isEditing(e.target as HTMLElement)) return;

      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === "=" || k === "+") {
          e.preventDefault();
          zoomAtCenter(1.2);
        } else if (k === "-") {
          e.preventDefault();
          zoomAtCenter(1 / 1.2);
        } else if (k === "z") {
          if (e.shiftKey) history.redo();
          else history.undo();
        } else if (k === "y") {
          history.redo();
        }
        return;
      }

      switch (e.key) {
        case "Delete":
        case "Backspace":
          deleteLayers();
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
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === " ") {
        spaceRef.current = false;
        panRef.current = null;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [deleteLayers, history, setCanvasState, zoomAtCenter]);

  // Fade + prune the laser trail while the laser tool is active.
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
    // Keep the freehand/pencil colour in sync with the chosen stroke.
    if (partial.stroke) setLastUsedColor(partial.stroke);
    if (mySelection?.length) applyStyleToSelection(partial);
  };

  // Frames = presentation slides, ordered top-to-bottom then left-to-right.
  // Read on demand (not via useStorage) to avoid a new-array-every-render loop.
  const collectSlides = useMutation(({ storage }): Slide[] => {
    const layers = storage.get("layers");
    const out: Slide[] = [];
    storage
      .get("layerIds")
      .toImmutable()
      .forEach((id) => {
        const l = layers.get(id)?.toImmutable() as Layer | undefined;
        if (l && l.type === LayerType.Frame) {
          out.push({
            id,
            title: l.value,
            bounds: { x: l.x, y: l.y, width: l.width, height: l.height },
          });
        }
      });
    return out.sort(
      (a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x
    );
  }, []);

  const startPresenting = () => {
    const s = collectSlides();
    if (!s.length) {
      toast.error("Add a Frame (press F) to present — each frame is a slide.");
      return;
    }
    setSlides(s);
    setPresenting(true);
  };

  return (
    <main
      ref={containerRef}
      className="fixed inset-0 overflow-hidden touch-none select-none"
    >
            <div
              className="fixed inset-0 -z-10 h-full w-full bg-background dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)] bg-[radial-gradient(#dadde2_1px,transparent_1px)] [background-size:16px_16px]"
              style={bgColor ? { backgroundColor: bgColor } : undefined}
            />
      {!presenting && (
      <CanvasMenu
        onExportPng={() => svgRef.current && exportPng(svgRef.current, bgColor || "#ffffff")}
        onExportSvg={() => svgRef.current && exportSvg(svgRef.current)}
        onReset={resetCanvas}
        bgColor={bgColor || "#ffffff"}
        setBgColor={setBgColor}
        onInsert={insertFlowchart}
        onPresent={startPresenting}
        origin={() => ({
          x: (window.innerWidth / 2 - camera.x) / camera.zoom,
          y: (window.innerHeight / 2 - camera.y) / camera.zoom,
        })}
      />
      )}
      {presenting && (
        <PresentationOverlay
          slides={slides}
          setCamera={setCamera}
          onExit={() => setPresenting(false)}
        />
      )}
      {!presenting && (
      <>
      {guest ? (
        <div className="top-2 absolute left-16 bg-white dark:bg-neutral-800 dark:text-neutral-100 rounded-md px-2 h-12 flex items-center shadow-md gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="SoftDraw" width={32} height={32} />
            <span className="font-semibold">SoftDraw</span>
          </Link>
          <span className="text-xs text-indigo-500 font-medium ml-1 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      ) : (
        <Info boardId={boardId} title={boardTitle} />
      )}
      <Participants />
      {guest && (
        <Button
          onClick={() => setCollabOpen(true)}
          className="absolute top-16 right-2 z-10 bg-indigo-500 hover:bg-indigo-600 text-white shadow-md"
          size="sm"
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
      )}
      {guest && (
        <CollaborationDialog
          open={collabOpen}
          onOpenChange={setCollabOpen}
          roomId={boardId}
          onStop={() => router.push("/")}
        />
      )}
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
      <SelectionTools camera={camera} setLastUsedColor={setLastUsedColor} />
      {panelTarget != null && (
        <PropertiesPanel
          target={panelTarget}
          style={panelStyle}
          onChange={onStyleChange}
          hasSelection={!!mySelection?.length}
          onZOrder={changeZOrder}
        />
      )}
      <BottomBar
        zoom={camera.zoom}
        onZoomIn={() => zoomAtCenter(1.2)}
        onZoomOut={() => zoomAtCenter(1 / 1.2)}
        onZoomReset={() => zoomAtCenter(1, 1)}
        undo={history.undo}
        redo={history.redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div
        data-tour="ai"
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10"
      >
        <AiFlowchartDialog
          onInsert={insertFlowchart}
          origin={() => ({
            x: (window.innerWidth / 2 - camera.x) / camera.zoom,
            y: (window.innerHeight / 2 - camera.y) / camera.zoom,
          })}
        />
      </div>
      <OnboardingTour />
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
            ? canvasToPngDataUrl(svgRef.current, bgColor || "#ffffff")
            : null
        }
      />
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
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        onPointerDown={onPointerDown}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          }}
        >
          {layerIds?.map((layerId) => (
            <LayerPreview
            key={layerId}
            id={layerId}
            onLayerPointerDown={onLayerPointerDown}
            selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}
          <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />
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
          <CursorsPresence />
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

export default Canvas;
