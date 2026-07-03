


export type Color = {
    r: number;
    g: number;
    b: number;
}

export type Camera = {
    x: number;
    y: number;
    zoom: number;
}

export enum LayerType {
    Rectangle,
    Ellipse,
    Path,
    Text,
    Note,
    // Appended (do not reorder — values are persisted in Liveblocks storage)
    Diamond,
    Triangle,
    Star,
    Line,
    Arrow,
    Frame,
    Embed,
    Image,
}

export type FillStyle = "solid" | "hachure" | "cross-hatch";
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type FontFamily = "hand" | "normal" | "code";
export type TextAlign = "left" | "center" | "right";
export type Arrowhead = "none" | "arrow" | "triangle";

// Per-layer visual style (all optional so existing layers keep working).
export type LayerStyle = {
    fill?: Color;            // legacy primary colour (kept in sync with `stroke`)
    stroke?: Color;          // outline / line / text colour (falls back to `fill`)
    bgColor?: Color | null;  // fill colour for shapes; null/undefined = transparent
    fillStyle?: FillStyle;
    strokeWidth?: number;    // 1 | 2 | 4
    strokeStyle?: StrokeStyle;
    roughness?: number;      // 0 | 1 | 2 (hand-drawn look — Phase 3)
    rounded?: boolean;       // sharp vs round edges
    opacity?: number;        // 0 - 100
    fontSize?: number;       // px
    fontFamily?: FontFamily;
    textAlign?: TextAlign;
    arrowType?: "straight" | "elbow";
    startArrowhead?: Arrowhead;
    endArrowhead?: Arrowhead;
};

type Box = {
    x: number;
    y: number;
    height: number;
    width: number;
    fill: Color;
    value?: string;
} & LayerStyle;

export type RectangleLayer = { type: LayerType.Rectangle } & Box;
export type EllipseLayer = { type: LayerType.Ellipse } & Box;
export type PathLayer = { type: LayerType.Path; points: number[][] } & Box;
export type TextLayer = { type: LayerType.Text } & Box;
export type NoteLayer = { type: LayerType.Note } & Box;

// Bounding-box shapes (behave like Rectangle/Ellipse for select/resize/translate).
export type DiamondLayer = { type: LayerType.Diamond } & Box;
export type TriangleLayer = { type: LayerType.Triangle } & Box;
export type StarLayer = { type: LayerType.Star } & Box;

// Connectors: drawn from (x, y) to (x + width, y + height).
export type LineLayer = { type: LayerType.Line } & Box;
export type ArrowLayer = { type: LayerType.Arrow } & Box;

// A labelled container region (value = title).
export type FrameLayer = { type: LayerType.Frame } & Box;
// An embedded website (value = URL).
export type EmbedLayer = { type: LayerType.Embed } & Box;
// A raster image (url = data URL or remote src).
export type ImageLayer = { type: LayerType.Image; url: string } & Box;

export type Point = {
    x: number;
    y: number;
}

export type XYWH = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export enum Side {
    Top = 1,
    Bottom = 2,
    Left = 4,
    Right = 8,
}

export type CanvasState = 
    | {
        mode: CanvasMode.None
    }
    | {
        mode: CanvasMode.Pressing,
        origin: Point;
    }
    | {
        mode: CanvasMode.SelectionNet,
        origin: Point;
        current?: Point;
    }
    | {
        mode: CanvasMode.Translating,
        current: Point;
    }
    | {
        mode: CanvasMode.Inserting,
        layerType: InsertableLayerType
    }
    | {
        mode: CanvasMode.Resizing,
        initialBounds: XYWH;
        corner: Side;
    }
    | {
        mode: CanvasMode.Pencil
    }
    | {
        mode: CanvasMode.Hand
    }
    | {
        mode: CanvasMode.Eraser
    }
    | {
        mode: CanvasMode.Laser
    }
    | {
        mode: CanvasMode.Lasso,
        points: number[][];
    }

export enum CanvasMode {
    None,
    Pressing,
    SelectionNet,
    Translating,
    Inserting,
    Resizing,
    Pencil,
    Hand,
    Eraser,
    Laser,
    Lasso,
}

// Layer types that can be placed via the toolbar's "Inserting" mode (Path is drawn, not inserted).
export type InsertableLayerType =
    | LayerType.Rectangle
    | LayerType.Ellipse
    | LayerType.Text
    | LayerType.Note
    | LayerType.Diamond
    | LayerType.Triangle
    | LayerType.Star
    | LayerType.Line
    | LayerType.Arrow
    | LayerType.Frame;

export type Layer =
    | RectangleLayer
    | EllipseLayer
    | PathLayer
    | TextLayer
    | NoteLayer
    | DiamondLayer
    | TriangleLayer
    | StarLayer
    | LineLayer
    | ArrowLayer
    | FrameLayer
    | EmbedLayer
    | ImageLayer;