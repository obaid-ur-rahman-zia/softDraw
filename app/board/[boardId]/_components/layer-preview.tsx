"use client";

import { useMutation, useStorage } from "@/liveblocks.config";
import React, { memo } from "react";
import { LayerRenderer } from "./layer-renderer";

interface LayerPreviewProps {
  id: string;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
}

export const LayerPreview = memo(
  ({ id, onLayerPointerDown, selectionColor }: LayerPreviewProps) => {
    const layer = useStorage((root) => root.layers.get(id));

    const updateValue = useMutation(({ storage }, layerId: string, value: string) => {
      storage.get("layers").get(layerId)?.set("value", value);
    }, []);

    if (!layer) {
      return null;
    }

    return (
      <LayerRenderer
        id={id}
        layer={layer}
        onLayerPointerDown={onLayerPointerDown}
        selectionColor={selectionColor}
        onValueChange={updateValue}
      />
    );
  }
);

LayerPreview.displayName = "LayerPreview";
