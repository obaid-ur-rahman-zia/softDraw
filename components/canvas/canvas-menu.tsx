"use client";

import { useState } from "react";
import Image from "next/image";
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
  Play,
  Users,
  Command as CommandIcon,
  HelpCircle,
  ChevronDown,
  MonitorDown,
  Pencil,
  Link2,
  Trash2 as TrashBoard,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP } from "@/lib/constants";
import { MermaidDialog } from "./mermaid-dialog";
import type { PositionedLayer } from "@/lib/flowchart-layout";

const CANVAS_BGS = ["#ffffff", "#f8f9fa", "#fdf6e3", "#f1f3f5", "#1e1e1e"];

interface CanvasMenuProps {
  onExportPng: () => void;
  onExportSvg: () => void;
  onReset: () => void;
  bgColor: string;
  setBgColor: (c: string) => void;
  onInsert: (layers: PositionedLayer[]) => void;
  origin: () => { x: number; y: number };
  onPresent?: () => void;
  onShare?: () => void;
  onCommandPalette?: () => void;
  onHelp?: () => void;
  /** Board-management actions (saved boards only). */
  onRename?: () => void;
  onCopyLink?: () => void;
  onDeleteBoard?: () => void;
  /** When set, the trigger shows the brand (logo + name) instead of a plain hamburger. */
  brand?: { subtitle?: string };
}

export function CanvasMenu({
  onExportPng,
  onExportSvg,
  onReset,
  bgColor,
  setBgColor,
  onInsert,
  origin,
  onPresent,
  onShare,
  onCommandPalette,
  onHelp,
  onRename,
  onCopyLink,
  onDeleteBoard,
  brand,
}: CanvasMenuProps) {
  const { theme, setTheme } = useTheme();
  const [mermaidOpen, setMermaidOpen] = useState(false);

  return (
    <>
      <div data-tour="menu" className="absolute top-2 left-2 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {brand ? (
              <Button
                variant="board"
                className="h-12 gap-2 bg-white dark:bg-neutral-800 dark:text-neutral-100 shadow-md px-2.5"
              >
                <Menu className="h-4 w-4 shrink-0" />
                <Image src="/logo.svg" alt={APP.APP_NAME} width={26} height={26} />
                <span className="font-semibold hidden sm:inline">
                  {APP.APP_NAME}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 hidden sm:inline" />
              </Button>
            ) : (
              <Button
                variant="board"
                size="icon"
                className="bg-white dark:bg-neutral-800 dark:text-neutral-100 shadow-md"
              >
                <Menu />
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {brand && (
              <>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Image src="/logo.svg" alt={APP.APP_NAME} width={30} height={30} />
                  <div className="leading-tight">
                    <p className="font-semibold text-sm">{APP.APP_NAME}</p>
                    {brand.subtitle && (
                      <p className="text-[11px] text-muted-foreground">
                        {brand.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {onRename && (
              <DropdownMenuItem className="cursor-pointer" onClick={onRename}>
                <Pencil className="h-4 w-4 mr-2" /> Rename board
              </DropdownMenuItem>
            )}
            {onCopyLink && (
              <DropdownMenuItem className="cursor-pointer" onClick={onCopyLink}>
                <Link2 className="h-4 w-4 mr-2" /> Copy board link
              </DropdownMenuItem>
            )}
            {onDeleteBoard && (
              <ConfirmModal
                header="Delete this board?"
                description="This permanently deletes the board and its contents."
                onConfirm={onDeleteBoard}
              >
                <button className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent text-red-600">
                  <TrashBoard className="h-4 w-4 mr-2" /> Delete board
                </button>
              </ConfirmModal>
            )}
            {(onRename || onCopyLink || onDeleteBoard) && (
              <DropdownMenuSeparator />
            )}

            {onShare && (
              <DropdownMenuItem className="cursor-pointer" onClick={onShare}>
                <Users className="h-4 w-4 mr-2" /> Live collaboration
              </DropdownMenuItem>
            )}
            {onCommandPalette && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={onCommandPalette}
              >
                <CommandIcon className="h-4 w-4 mr-2" /> Command palette
                <span className="ml-auto text-xs text-muted-foreground">
                  Ctrl /
                </span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
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
            {onPresent && (
              <DropdownMenuItem className="cursor-pointer" onClick={onPresent}>
                <Play className="h-4 w-4 mr-2" /> Present frames
              </DropdownMenuItem>
            )}
            {onHelp && (
              <DropdownMenuItem className="cursor-pointer" onClick={onHelp}>
                <HelpCircle className="h-4 w-4 mr-2" /> Help & tour
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/download" target="_blank">
                <MonitorDown className="h-4 w-4 mr-2" /> Get desktop app
              </Link>
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
                    theme === v
                      ? "bg-blue-500 text-white border-blue-500"
                      : "hover:bg-accent"
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
