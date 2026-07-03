"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Undo2, Redo2 } from "lucide-react";

interface BottomBarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const BottomBar = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  undo,
  redo,
  canUndo,
  canRedo,
}: BottomBarProps) => {
  return (
    <div
      data-tour="zoom"
      className="absolute bottom-16 left-2 sm:bottom-3 sm:left-3 z-10 flex items-center gap-x-2 select-none"
    >
      <div className="bg-white dark:bg-neutral-800 dark:text-neutral-100 rounded-lg shadow-md flex items-center p-1">
        <Button variant="board" size="icon" onClick={onZoomOut}>
          <Minus />
        </Button>
        <button
          onClick={onZoomReset}
          title="Reset zoom"
          className="w-14 text-sm text-center text-neutral-700 hover:text-black dark:text-neutral-200 dark:hover:text-white"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button variant="board" size="icon" onClick={onZoomIn}>
          <Plus />
        </Button>
      </div>
      <div className="bg-white dark:bg-neutral-800 dark:text-neutral-100 rounded-lg shadow-md flex items-center p-1">
        <Button variant="board" size="icon" disabled={!canUndo} onClick={undo}>
          <Undo2 />
        </Button>
        <Button variant="board" size="icon" disabled={!canRedo} onClick={redo}>
          <Redo2 />
        </Button>
      </div>
    </div>
  );
};
