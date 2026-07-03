"use client";

import { textFont } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { fontFamilyClass } from "@/lib/style";
import { FontFamily, TextAlign } from "@/types/canvas";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";

interface ShapeLabelProps {
  width: number;
  height: number;
  value?: string;
  color?: string;
  onValueChange?: (value: string) => void;
  fontSize?: number;
  fontFamily?: FontFamily;
  textAlign?: TextAlign;
}

/** Centered, optionally-editable text label placed inside a shape's local box. */
export const ShapeLabel = ({
  width,
  height,
  value,
  color,
  onValueChange,
  fontSize,
  fontFamily,
  textAlign,
}: ShapeLabelProps) => {
  if (!value && !onValueChange) return null;

  const handleChange = (e: ContentEditableEvent) => onValueChange?.(e.target.value);
  const size = fontSize ?? Math.max(10, Math.min(width, height) * 0.16);
  const align = textAlign ?? "center";
  const justify =
    align === "left"
      ? "justify-start text-left"
      : align === "right"
        ? "justify-end text-right"
        : "justify-center text-center";
  const fontCls =
    !fontFamily || fontFamily === "hand"
      ? textFont.className
      : fontFamilyClass(fontFamily);

  return (
    <foreignObject x={0} y={0} width={width} height={height}>
      <div
        className={cn("w-full h-full flex items-center p-2", justify)}
      >
        <ContentEditable
          html={value || ""}
          disabled={!onValueChange}
          onChange={handleChange}
          className={cn(
            "outline-none max-w-full break-words leading-tight select-none focus:select-text",
            fontCls
          )}
          style={{ fontSize: size, color: color || "#111827" }}
        />
      </div>
    </foreignObject>
  );
};
