import { useEffect, useRef } from "react";
import { textFont } from "@/lib/constants";
import { cn, colorToCss, getContrastingTextColor } from "@/lib/utils";
import { fontFamilyClass } from "@/lib/style";
import { NoteLayer } from "@/types/canvas";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { focusAndSelect } from "./text";
import { consumeTextFocus } from "@/lib/text-focus";

const calculateFontSize = (width: number, height: number) => {
  const scaleFactor = 0.15;
  return Math.min(height * scaleFactor, width * scaleFactor, 1000);
};

interface NoteProps {
  id: string;
  layer: NoteLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
  onValueChange?: (value: string) => void;
}

export const Note = ({
  id,
  layer,
  selectionColor,
  onPointerDown,
  onValueChange,
}: NoteProps) => {
  const { x, y, width, height, fill, value } = layer;
  const size = layer.fontSize ?? calculateFontSize(width, height);
  const align = layer.textAlign ?? "center";
  const justify =
    align === "left"
      ? "justify-start text-left"
      : align === "right"
        ? "justify-end text-right"
        : "justify-center text-center";
  const fontCls =
    !layer.fontFamily || layer.fontFamily === "hand"
      ? textFont.className
      : fontFamilyClass(layer.fontFamily);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onValueChange && consumeTextFocus(id)) {
      requestAnimationFrame(() => focusAndSelect(ref.current));
    }
  }, [id, onValueChange]);

  const handleContentChange = (e: ContentEditableEvent) =>
    onValueChange?.(e.target.value);

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
        backgroundColor: fill ? colorToCss(fill) : "#000",
      }}
      className="drop-shadow-xl shadow-md"
    >
      <ContentEditable
        innerRef={ref as unknown as React.RefObject<HTMLElement>}
        html={value || "Text"}
        onChange={handleContentChange}
        onDoubleClick={startEditing}
        disabled={!onValueChange}
        className={cn(
          "w-full h-full flex items-center select-none focus:select-text cursor-text",
          justify,
          fontCls
        )}
        style={{
          fontSize: size,
          color: fill ? getContrastingTextColor(fill) : "#000",
        }}
      />
    </foreignObject>
  );
};
