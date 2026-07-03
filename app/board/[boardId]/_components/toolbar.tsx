import {
  Circle,
  Pencil,
  MousePointer2,
  Square,
  StickyNote,
  Type,
  Diamond,
  Triangle,
  Star,
  Minus,
  ArrowRight,
  Hand,
  Eraser,
  Lock,
  LockOpen,
} from "lucide-react";
import type { ReactNode } from "react";
import { ToolButton } from "./tool-button";
import { CanvasMode, CanvasState, LayerType } from "@/types/canvas";

interface ToolbarProps {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  locked: boolean;
  setLocked: (locked: boolean) => void;
  moreMenu?: ReactNode;
}

const Divider = () => (
  <div className="mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-700 shrink-0" />
);

const Toolbar = ({
  canvasState,
  setCanvasState,
  locked,
  setLocked,
  moreMenu,
}: ToolbarProps) => {
  const isInserting = (type: LayerType) =>
    canvasState.mode === CanvasMode.Inserting &&
    canvasState.layerType === type;

  return (
    <div
      data-tour="toolbar"
      className="absolute left-1/2 -translate-x-1/2 z-10 bottom-2 max-w-[calc(100vw-1rem)] sm:bottom-auto sm:top-2 sm:max-w-[calc(100vw-6.5rem)]"
    >
      <div className="bg-white dark:bg-neutral-800 dark:text-neutral-100 rounded-lg p-1.5 flex items-center gap-x-0.5 shadow-md overflow-x-auto no-scrollbar">
        <ToolButton
          label={locked ? "Unlock (keep tool)" : "Keep selected tool active"}
          icon={locked ? Lock : LockOpen}
          onClick={() => setLocked(!locked)}
          isActive={locked}
          side="bottom"
        />
        <Divider />
        <ToolButton
          label="Hand (pan)"
          icon={Hand}
          onClick={() => setCanvasState({ mode: CanvasMode.Hand })}
          isActive={canvasState.mode === CanvasMode.Hand}
          side="bottom"
          shortcut="H"
        />
        <ToolButton
          label="Select"
          icon={MousePointer2}
          onClick={() => setCanvasState({ mode: CanvasMode.None })}
          isActive={
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Pressing ||
            canvasState.mode === CanvasMode.Translating ||
            canvasState.mode === CanvasMode.SelectionNet ||
            canvasState.mode === CanvasMode.Resizing
          }
          side="bottom"
          shortcut="1"
        />
        <Divider />
        <ToolButton
          label="Rectangle"
          icon={Square}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Rectangle,
            })
          }
          isActive={isInserting(LayerType.Rectangle)}
          side="bottom"
          shortcut="2"
        />
        <ToolButton
          label="Diamond"
          icon={Diamond}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Diamond,
            })
          }
          isActive={isInserting(LayerType.Diamond)}
          side="bottom"
          shortcut="3"
        />
        <ToolButton
          label="Ellipse"
          icon={Circle}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Ellipse,
            })
          }
          isActive={isInserting(LayerType.Ellipse)}
          side="bottom"
          shortcut="4"
        />
        <ToolButton
          label="Triangle"
          icon={Triangle}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Triangle,
            })
          }
          isActive={isInserting(LayerType.Triangle)}
          side="bottom"
        />
        <ToolButton
          label="Star"
          icon={Star}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Star,
            })
          }
          isActive={isInserting(LayerType.Star)}
          side="bottom"
        />
        <Divider />
        <ToolButton
          label="Arrow"
          icon={ArrowRight}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Arrow,
            })
          }
          isActive={isInserting(LayerType.Arrow)}
          side="bottom"
          shortcut="5"
        />
        <ToolButton
          label="Line"
          icon={Minus}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Line,
            })
          }
          isActive={isInserting(LayerType.Line)}
          side="bottom"
          shortcut="6"
        />
        <Divider />
        <ToolButton
          label="Draw"
          icon={Pencil}
          onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
          isActive={canvasState.mode === CanvasMode.Pencil}
          side="bottom"
          shortcut="7"
        />
        <ToolButton
          label="Text"
          icon={Type}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Text,
            })
          }
          isActive={isInserting(LayerType.Text)}
          side="bottom"
          shortcut="8"
        />
        <ToolButton
          label="Sticky note"
          icon={StickyNote}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Note,
            })
          }
          isActive={isInserting(LayerType.Note)}
          side="bottom"
          shortcut="9"
        />
        <Divider />
        <ToolButton
          label="Eraser"
          icon={Eraser}
          onClick={() => setCanvasState({ mode: CanvasMode.Eraser })}
          isActive={canvasState.mode === CanvasMode.Eraser}
          side="bottom"
          shortcut="0"
        />
        {moreMenu && (
          <>
            <Divider />
            {moreMenu}
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;

export const ToolbarSkeleton = () => {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white h-[52px] w-[600px] shadow-md rounded-lg" />
  );
};
