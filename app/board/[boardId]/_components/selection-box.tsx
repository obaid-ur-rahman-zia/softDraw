"use client";

import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { useSelf, useStorage } from "@/liveblocks.config";
import { LayerType, Side, XYWH } from "@/types/canvas";
import { memo } from "react";

interface SelectionBoxProps {
  onResizeHandlePointerDown: (corners: Side, initialBounds: XYWH) => void;
  zoom?: number;
}

const HANDLES = [
  { c: Side.Top + Side.Left, dx: 0, dy: 0, cur: "nwse-resize" },
  { c: Side.Top, dx: 0.5, dy: 0, cur: "ns-resize" },
  { c: Side.Top + Side.Right, dx: 1, dy: 0, cur: "nesw-resize" },
  { c: Side.Right, dx: 1, dy: 0.5, cur: "ew-resize" },
  { c: Side.Bottom + Side.Right, dx: 1, dy: 1, cur: "nwse-resize" },
  { c: Side.Bottom, dx: 0.5, dy: 1, cur: "ns-resize" },
  { c: Side.Bottom + Side.Left, dx: 0, dy: 1, cur: "nesw-resize" },
  { c: Side.Left, dx: 0, dy: 0.5, cur: "ew-resize" },
] as const;

export const SelectionBox = memo(
  ({ onResizeHandlePointerDown, zoom = 1 }: SelectionBoxProps) => {
    const soleLayerId = useSelf((me) =>
      me.presence.selection.length === 1 ? me.presence.selection[0] : null
    );

    const isShowingHandles = useStorage(
      (root) =>
        soleLayerId && root.layers.get(soleLayerId)?.type !== LayerType.Path
    );

    const bounds = useSelectionBounds();
    if (!bounds) return null;

    const z = zoom || 1;
    const gap = 6 / z; // constant screen-space gap around the shape
    const sw = 1.5 / z; // constant stroke width
    const hs = 10 / z; // constant handle size
    const bx = bounds.x - gap;
    const by = bounds.y - gap;
    const bw = bounds.width + gap * 2;
    const bh = bounds.height + gap * 2;

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

        {isShowingHandles &&
          HANDLES.map((h, i) => (
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
                onResizeHandlePointerDown(h.c, bounds);
              }}
            />
          ))}
      </>
    );
  }
);

SelectionBox.displayName = "SelectionBox";
