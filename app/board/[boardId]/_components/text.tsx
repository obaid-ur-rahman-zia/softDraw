import { useEffect, useRef } from "react";
import { textFont } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { fontFamilyClass, resolveStroke } from "@/lib/style";
import { TextLayer } from "@/types/canvas";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { consumeTextFocus } from "@/lib/text-focus";

/** Focus a contentEditable element and select all its text. */
export function focusAndSelect(el: HTMLElement | null) {
  if (!el) return;
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

const DEFAULT_TEXT_SIZE = 20;

interface TextProps {
  id: string;
  layer: TextLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
  onValueChange?: (value: string) => void;
}

export const Text = ({
  id,
  layer,
  selectionColor,
  onPointerDown,
  onValueChange,
}: TextProps) => {
  const { x, y, width, height, value } = layer;
  const size = layer.fontSize ?? DEFAULT_TEXT_SIZE;
  const color = resolveStroke(layer);
  const align = layer.textAlign ?? "left";
  const justify =
    align === "left"
      ? "justify-start text-left"
      : align === "right"
        ? "justify-end text-right"
        : "justify-center text-center";
  // Default to a clean sans; the hand-drawn Kalam font is opt-in.
  const family = layer.fontFamily ?? "normal";
  const fontCls =
    family === "hand" ? textFont.className : fontFamilyClass(family);

  const ref = useRef<HTMLDivElement>(null);

  // Auto-focus a freshly-inserted text so the user can type immediately.
  useEffect(() => {
    if (onValueChange && consumeTextFocus(id)) {
      requestAnimationFrame(() => focusAndSelect(ref.current));
    }
  }, [id, onValueChange]);

  const handleContentChange = (e: ContentEditableEvent) =>
    onValueChange?.(e.target.value);

  // Double-click enters edit mode (focus + select all), Excalidraw-style.
  const startEditing = (e: React.SyntheticEvent) => {
    if (!onValueChange) return;
    e.stopPropagation();
    focusAndSelect(ref.current);
  };

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      onDoubleClick={startEditing}
      opacity={(layer.opacity ?? 100) / 100}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : "none",
      }}
    >
      <ContentEditable
        innerRef={ref as unknown as React.RefObject<HTMLElement>}
        html={value || "Text"}
        onChange={handleContentChange}
        onDoubleClick={startEditing}
        disabled={!onValueChange}
        className={cn(
          "w-full h-full flex items-start outline-none select-none focus:select-text cursor-text leading-snug break-words whitespace-pre-wrap",
          justify,
          fontCls
        )}
        style={{ fontSize: size, color }}
      />
    </foreignObject>
  );
};
