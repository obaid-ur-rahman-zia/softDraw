"use client";

import { Color, LayerStyle, LayerType } from "@/types/canvas";
import { cn, colorToCss } from "@/lib/utils";
import {
  BG_PALETTE,
  STROKE_PALETTE,
  colorsEqual,
  hexToColor,
} from "@/lib/style";
import {
  ArrowRight,
  MoveUpRight,
  Pencil,
  Type,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronsDown,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  Trash2,
} from "lucide-react";

export type StyleTarget = LayerType | "pencil";

interface PropertiesPanelProps {
  target: StyleTarget;
  style: LayerStyle;
  onChange: (partial: Partial<LayerStyle>) => void;
  hasSelection: boolean;
  onZOrder: (dir: "front" | "back" | "forward" | "backward") => void;
  onDelete?: () => void;
}

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    {children}
  </div>
);

const Swatch = ({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    title={title}
    onClick={onClick}
    className={cn(
      "h-7 w-7 rounded-md flex items-center justify-center border border-neutral-200 dark:border-neutral-600 overflow-hidden transition",
      active && "ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-neutral-800"
    )}
  >
    {children}
  </button>
);

const OptionRow = ({
  options,
  value,
  onSelect,
}: {
  options: { value: string; node: React.ReactNode; title?: string }[];
  value: string | undefined;
  onSelect: (v: string) => void;
}) => (
  <div className="flex gap-1.5">
    {options.map((o) => (
      <Swatch
        key={o.value}
        title={o.title}
        active={value === o.value}
        onClick={() => onSelect(o.value)}
      >
        {o.node}
      </Swatch>
    ))}
  </div>
);

const ColorRow = ({
  palette,
  value,
  onSelect,
  allowCustom = true,
}: {
  palette: (Color | null)[];
  value: Color | null | undefined;
  onSelect: (c: Color | null) => void;
  allowCustom?: boolean;
}) => (
  <div className="flex items-center gap-1.5">
    {palette.map((c, i) => (
      <Swatch
        key={i}
        active={colorsEqual(value ?? null, c)}
        onClick={() => onSelect(c)}
        title={c ? colorToCss(c) : "Transparent"}
      >
        {c ? (
          <span
            className="h-full w-full"
            style={{ background: colorToCss(c) }}
          />
        ) : (
          <span className="h-full w-full bg-[conic-gradient(#e5e5e5_90deg,#fff_90deg_180deg,#e5e5e5_180deg_270deg,#fff_270deg)] bg-[length:8px_8px]" />
        )}
      </Swatch>
    ))}
    {allowCustom && (
      <>
        <div className="mx-0.5 h-6 w-px bg-neutral-200" />
        <label className="h-7 w-7 rounded-md border border-neutral-200 overflow-hidden cursor-pointer">
          <span
            className="block h-full w-full"
            style={{ background: value ? colorToCss(value) : "#ffffff" }}
          />
          <input
            type="color"
            className="sr-only"
            value={value ? colorToCss(value) : "#000000"}
            onChange={(e) => onSelect(hexToColor(e.target.value))}
          />
        </label>
      </>
    )}
  </div>
);

const Line = ({ w, dash }: { w: number; dash?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <line
      x1="2"
      y1="9"
      x2="16"
      y2="9"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeDasharray={dash}
    />
  </svg>
);

export const PropertiesPanel = ({
  target,
  style,
  onChange,
  hasSelection,
  onZOrder,
  onDelete,
}: PropertiesPanelProps) => {
  const isShape =
    target === LayerType.Rectangle ||
    target === LayerType.Ellipse ||
    target === LayerType.Diamond ||
    target === LayerType.Triangle ||
    target === LayerType.Star;
  const isConnector = target === LayerType.Line || target === LayerType.Arrow;
  const isText = target === LayerType.Text || target === LayerType.Note;
  const isDraw = target === "pencil";
  // Freehand strokes have no fill area — only shapes get a background/fill.
  const hasBg = isShape;
  const hasEdges =
    target === LayerType.Rectangle ||
    target === LayerType.Diamond ||
    target === LayerType.Triangle;
  const hasStrokeStyle = isShape || isConnector;
  const hasStrokeWidth = isShape || isConnector || isDraw;

  return (
    <div className="absolute top-16 left-2 z-10 w-[180px] sm:w-[210px] max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar rounded-lg bg-white dark:bg-neutral-800 dark:text-neutral-100 p-3 shadow-md space-y-4 select-none">
      <Section label="Stroke">
        <ColorRow
          palette={STROKE_PALETTE}
          value={style.stroke}
          onSelect={(c) => onChange({ stroke: c ?? undefined, fill: c ?? undefined })}
        />
      </Section>

      {hasBg && (
        <Section label="Background">
          <ColorRow
            palette={BG_PALETTE}
            value={style.bgColor}
            onSelect={(c) => onChange({ bgColor: c })}
          />
        </Section>
      )}

      {hasBg && (style.bgColor ?? null) !== null && (
        <Section label="Fill">
          <OptionRow
            value={style.fillStyle ?? "solid"}
            onSelect={(v) => onChange({ fillStyle: v as LayerStyle["fillStyle"] })}
            options={[
              {
                value: "hachure",
                title: "Hachure",
                node: <span className="text-xs">╱╱</span>,
              },
              {
                value: "cross-hatch",
                title: "Cross-hatch",
                node: <span className="text-xs">▦</span>,
              },
              {
                value: "solid",
                title: "Solid",
                node: <span className="h-4 w-4 rounded bg-current" />,
              },
            ]}
          />
        </Section>
      )}

      {hasStrokeWidth && (
        <Section label="Stroke width">
          <OptionRow
            value={String(style.strokeWidth ?? 2)}
            onSelect={(v) => onChange({ strokeWidth: Number(v) })}
            options={[
              { value: "1", title: "Thin", node: <Line w={1.5} /> },
              { value: "2", title: "Bold", node: <Line w={3} /> },
              { value: "4", title: "Extra bold", node: <Line w={5} /> },
            ]}
          />
        </Section>
      )}

      {hasStrokeStyle && (
        <Section label="Stroke style">
          <OptionRow
            value={style.strokeStyle ?? "solid"}
            onSelect={(v) =>
              onChange({ strokeStyle: v as LayerStyle["strokeStyle"] })
            }
            options={[
              { value: "solid", title: "Solid", node: <Line w={2.5} /> },
              {
                value: "dashed",
                title: "Dashed",
                node: <Line w={2.5} dash="4 3" />,
              },
              {
                value: "dotted",
                title: "Dotted",
                node: <Line w={2.5} dash="1 3" />,
              },
            ]}
          />
        </Section>
      )}

      {isConnector && (
        <Section label="Arrowheads">
          <div className="flex gap-1.5">
            <OptionRow
              value={style.startArrowhead ?? "none"}
              onSelect={(v) =>
                onChange({ startArrowhead: v as LayerStyle["startArrowhead"] })
              }
              options={[
                { value: "none", title: "No start head", node: <span>—</span> },
                {
                  value: "arrow",
                  title: "Start arrow",
                  node: <MoveUpRight className="h-4 w-4 rotate-180" />,
                },
              ]}
            />
            <OptionRow
              value={style.endArrowhead ?? "arrow"}
              onSelect={(v) =>
                onChange({ endArrowhead: v as LayerStyle["endArrowhead"] })
              }
              options={[
                { value: "none", title: "No end head", node: <span>—</span> },
                {
                  value: "arrow",
                  title: "End arrow",
                  node: <ArrowRight className="h-4 w-4" />,
                },
              ]}
            />
          </div>
        </Section>
      )}

      {hasEdges && (
        <Section label="Edges">
          <OptionRow
            value={style.rounded === false ? "sharp" : "round"}
            onSelect={(v) => onChange({ rounded: v === "round" })}
            options={[
              {
                value: "sharp",
                title: "Sharp",
                node: <span className="h-4 w-4 border-2 border-current" />,
              },
              {
                value: "round",
                title: "Round",
                node: <span className="h-4 w-4 rounded-md border-2 border-current" />,
              },
            ]}
          />
        </Section>
      )}

      {isText && (
        <>
          <Section label="Font family">
            <OptionRow
              value={style.fontFamily ?? "normal"}
              onSelect={(v) =>
                onChange({ fontFamily: v as LayerStyle["fontFamily"] })
              }
              options={[
                {
                  value: "hand",
                  title: "Hand-drawn",
                  node: <Pencil className="h-4 w-4" />,
                },
                {
                  value: "normal",
                  title: "Normal",
                  node: <Type className="h-4 w-4" />,
                },
                {
                  value: "code",
                  title: "Code",
                  node: <Code className="h-4 w-4" />,
                },
              ]}
            />
          </Section>
          <Section label="Font size">
            <OptionRow
              value={String(style.fontSize ?? 20)}
              onSelect={(v) => onChange({ fontSize: Number(v) })}
              options={[
                { value: "16", title: "Small", node: <span className="text-xs">S</span> },
                { value: "20", title: "Medium", node: <span className="text-sm">M</span> },
                { value: "28", title: "Large", node: <span className="text-base">L</span> },
                { value: "36", title: "Extra large", node: <span className="text-lg">XL</span> },
              ]}
            />
          </Section>
          <Section label="Text align">
            <OptionRow
              value={style.textAlign ?? "center"}
              onSelect={(v) => onChange({ textAlign: v as LayerStyle["textAlign"] })}
              options={[
                { value: "left", title: "Left", node: <AlignLeft className="h-4 w-4" /> },
                { value: "center", title: "Center", node: <AlignCenter className="h-4 w-4" /> },
                { value: "right", title: "Right", node: <AlignRight className="h-4 w-4" /> },
              ]}
            />
          </Section>
        </>
      )}

      <Section label="Opacity">
        <input
          type="range"
          min={10}
          max={100}
          step={10}
          value={style.opacity ?? 100}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </Section>

      {hasSelection && (
        <Section label="Layers">
          <div className="flex gap-1.5">
            <Swatch active={false} onClick={() => onZOrder("back")} title="Send to back">
              <ChevronsDown className="h-4 w-4" />
            </Swatch>
            <Swatch active={false} onClick={() => onZOrder("backward")} title="Send backward">
              <ChevronDown className="h-4 w-4" />
            </Swatch>
            <Swatch active={false} onClick={() => onZOrder("forward")} title="Bring forward">
              <ChevronUp className="h-4 w-4" />
            </Swatch>
            <Swatch active={false} onClick={() => onZOrder("front")} title="Bring to front">
              <ChevronsUp className="h-4 w-4" />
            </Swatch>
          </div>
        </Section>
      )}

      {hasSelection && onDelete && (
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 rounded-md border border-red-200 dark:border-red-900/50 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      )}
    </div>
  );
};
