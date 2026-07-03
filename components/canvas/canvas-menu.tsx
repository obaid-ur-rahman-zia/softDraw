"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { useTheme } from "next-themes";
import {
  Menu,
  ImageDown,
  FileCode,
  Workflow,
  Trash2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MermaidDialog } from "./mermaid-dialog";
import type { PositionedLayer } from "@/lib/flowchart-layout";

const CANVAS_BGS = [
  "#ffffff",
  "#f8f9fa",
  "#fdf6e3",
  "#f1f3f5",
  "#1e1e1e",
];

interface CanvasMenuProps {
  onExportPng: () => void;
  onExportSvg: () => void;
  onReset: () => void;
  bgColor: string;
  setBgColor: (c: string) => void;
  onInsert: (layers: PositionedLayer[]) => void;
  origin: () => { x: number; y: number };
}

export function CanvasMenu({
  onExportPng,
  onExportSvg,
  onReset,
  bgColor,
  setBgColor,
  onInsert,
  origin,
}: CanvasMenuProps) {
  const { theme, setTheme } = useTheme();
  const [mermaidOpen, setMermaidOpen] = useState(false);

  return (
    <>
      <div data-tour="menu" className="absolute top-2 left-2 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="board"
              size="icon"
              className="bg-white dark:bg-neutral-800 dark:text-neutral-100 shadow-md"
            >
              <Menu />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuItem className="cursor-pointer" onClick={onExportPng}>
              <ImageDown className="h-4 w-4 mr-2" /> Export image (PNG)
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={onExportSvg}>
              <FileCode className="h-4 w-4 mr-2" /> Export as SVG
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setMermaidOpen(true);
              }}
            >
              <Workflow className="h-4 w-4 mr-2" /> Mermaid to diagram
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <ConfirmModal
              header="Reset the canvas?"
              description="This permanently removes everything on the canvas."
              onConfirm={onReset}
            >
              <button className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent text-red-600">
                <Trash2 className="h-4 w-4 mr-2" /> Reset the canvas
              </button>
            </ConfirmModal>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Theme
            </DropdownMenuLabel>
            <div className="flex gap-1 px-2 pb-1">
              {[
                { v: "light", icon: Sun },
                { v: "dark", icon: Moon },
                { v: "system", icon: Monitor },
              ].map(({ v, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setTheme(v)}
                  className={cn(
                    "flex-1 flex items-center justify-center rounded-md border py-1.5",
                    theme === v ? "bg-blue-500 text-white border-blue-500" : "hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Canvas background
            </DropdownMenuLabel>
            <div className="flex gap-1.5 px-2 pb-2">
              {CANVAS_BGS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  title={c}
                  className={cn(
                    "h-6 w-6 rounded-md border border-neutral-300",
                    bgColor === c && "ring-2 ring-blue-500"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MermaidDialog
        open={mermaidOpen}
        onOpenChange={setMermaidOpen}
        onInsert={onInsert}
        origin={origin}
      />
    </>
  );
}
