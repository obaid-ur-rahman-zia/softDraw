import { textFont } from "@/lib/constants";
import { cn, colorToCss, getContrastingTextColor } from "@/lib/utils";
import { useMutation } from "@/liveblocks.config";
import { NoteLayer } from "@/types/canvas";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";


const calculateFontSize = (width: number, height: number) => {
  const maxFontSize = 1000;
  const scaleFactor = 0.15;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * scaleFactor;

  return Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth, maxFontSize);
};

interface NoteProps {
  id: string;
  layer: NoteLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

export const Note = ({
  id,
  layer,
  selectionColor,
  onPointerDown,
}: NoteProps) => {
  const { x, y, width, height, fill, value } = layer;

    const updateValue = useMutation((
        {storage},
        newValue: string
    ) => {
        const liveLayers = storage.get("layers");

        liveLayers.get(id)?.set("value", newValue)
    }, [])

    const handleContentChange = (e: ContentEditableEvent) => {
        updateValue(e.target.value)
    }

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : "none",
        backgroundColor: fill ? colorToCss(fill) : "#000"
      }}
      className="drop-shadow-xl shadow-md"
    >
      <ContentEditable
        html={value || "Text"}
        onChange={handleContentChange}
        className={cn(
          "w-full h-full flex items-center justify-center text-center outline-none",
          textFont.className
        )}
        style={{
          fontSize: calculateFontSize(width, height),
          color: fill ? getContrastingTextColor(fill) : "#000",
        }}
      />
    </foreignObject>
  );
};
