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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CanvasMode, CanvasState, LayerType } from "@/types/canvas";
import { AiFlowchartDialog } from "@/components/ai/ai-flowchart-dialog";
import { MermaidDialog } from "./mermaid-dialog";
import type { PositionedLayer } from "@/lib/flowchart-layout";
import {
  Shapes,
  Zap,
  Sparkles,
  Workflow,
  Frame as FrameIcon,
  Code2,
  Lasso,
  Hand as HandIcon,
  ScanLine,
  ImagePlus,
} from "lucide-react";

interface MoreToolsMenuProps {
  canvasState: CanvasState;
  setCanvasState: (s: CanvasState) => void;
  onInsert: (layers: PositionedLayer[]) => void;
  origin: () => { x: number; y: number };
  onEmbed: (url: string) => void;
  onHandDraw?: () => void;
  onWireframe?: () => void;
  onImage?: () => void;
}

export function MoreToolsMenu({
  canvasState,
  setCanvasState,
  onInsert,
  origin,
  onEmbed,
  onHandDraw,
  onWireframe,
  onImage,
}: MoreToolsMenuProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [mermaidOpen, setMermaidOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const active =
    canvasState.mode === CanvasMode.Laser ||
    canvasState.mode === CanvasMode.Lasso ||
    (canvasState.mode === CanvasMode.Inserting &&
      canvasState.layerType === LayerType.Frame);

  const Shortcut = ({ k }: { k: string }) => (
    <span className="ml-auto text-xs text-muted-foreground">{k}</span>
  );

  return (
    <>
      <div data-tour="more" className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={active ? "boardActive" : "board"}
              size="icon"
              title="More tools"
            >
              <Shapes />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                setCanvasState({
                  mode: CanvasMode.Inserting,
                  layerType: LayerType.Frame,
                })
              }
            >
              <FrameIcon className="h-4 w-4 mr-2" /> Frame tool <Shortcut k="F" />
            </DropdownMenuItem>
            {onImage && (
              <DropdownMenuItem className="cursor-pointer" onClick={onImage}>
                <ImagePlus className="h-4 w-4 mr-2" /> Insert image
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setEmbedOpen(true);
              }}
            >
              <Code2 className="h-4 w-4 mr-2" /> Web Embed
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setCanvasState({ mode: CanvasMode.Laser })}
            >
              <Zap className="h-4 w-4 mr-2" /> Laser pointer <Shortcut k="K" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                setCanvasState({ mode: CanvasMode.Lasso, points: [] })
              }
            >
              <Lasso className="h-4 w-4 mr-2" /> Lasso selection
            </DropdownMenuItem>
            {onHandDraw && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={onHandDraw}
              >
                <HandIcon className="h-4 w-4 mr-2" /> Hand-gesture draw
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Generate
            </DropdownMenuLabel>
            {onWireframe && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={onWireframe}
              >
                <ScanLine className="h-4 w-4 mr-2" /> Wireframe to code (AI)
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setAiOpen(true);
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" /> Text to diagram (AI)
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AiFlowchartDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        hideTrigger
        onInsert={onInsert}
        origin={origin}
      />
      <MermaidDialog
        open={mermaidOpen}
        onOpenChange={setMermaidOpen}
        onInsert={onInsert}
        origin={origin}
      />

      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed a website</DialogTitle>
            <DialogDescription>
              Paste a URL to embed it live on the canvas (YouTube, docs,
              dashboards…). Some sites block embedding.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
          />
          <DialogFooter>
            <Button
              disabled={!embedUrl.trim()}
              onClick={() => {
                let url = embedUrl.trim();
                if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
                onEmbed(url);
                setEmbedOpen(false);
                setEmbedUrl("");
              }}
            >
              Embed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
