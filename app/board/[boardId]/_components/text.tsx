import { textFont } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { fontFamilyClass, resolveStroke } from "@/lib/style";
import { TextLayer } from "@/types/canvas";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";

const calculateFontSize = (width: number, height: number) => {
  const scaleFactor = 0.5;
  return Math.min(height * scaleFactor, width * scaleFactor, 1000);
};

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
  const size = layer.fontSize ?? calculateFontSize(width, height);
  const color = resolveStroke(layer);
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

  const handleContentChange = (e: ContentEditableEvent) =>
    onValueChange?.(e.target.value);

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      opacity={(layer.opacity ?? 100) / 100}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : "none",
      }}
    >
      <ContentEditable
        html={value || "Text"}
        onChange={handleContentChange}
        disabled={!onValueChange}
        className={cn(
          "w-full h-full flex items-center drop-shadow-md outline-none select-none focus:select-text",
          justify,
          fontCls
        )}
        style={{ fontSize: size, color }}
      />
    </foreignObject>
  );
};
