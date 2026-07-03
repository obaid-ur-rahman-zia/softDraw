"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { parseMermaid } from "@/lib/mermaid";
import { flowchartToLayers, type PositionedLayer } from "@/lib/flowchart-layout";

const EXAMPLE = `flowchart TD
  A[Start] --> B{Logged in?}
  B -->|Yes| C[Dashboard]
  B -->|No| D[Login page]
  D --> B`;

interface MermaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (layers: PositionedLayer[]) => void;
  origin: () => { x: number; y: number };
}

export function MermaidDialog({
  open,
  onOpenChange,
  onInsert,
  origin,
}: MermaidDialogProps) {
  const [text, setText] = useState(EXAMPLE);

  const onInsertClick = () => {
    try {
      const graph = parseMermaid(text);
      if (!graph.nodes.length) {
        toast.error("No nodes found in the diagram.");
        return;
      }
      onInsert(flowchartToLayers(graph, origin()));
      toast.success("Diagram inserted!");
      onOpenChange(false);
    } catch {
      toast.error("Could not parse the Mermaid diagram.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mermaid to diagram</DialogTitle>
          <DialogDescription>
            Paste Mermaid <code>flowchart</code> syntax and drop it on the canvas.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="font-mono text-xs"
          spellCheck={false}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setText(EXAMPLE)}>
            Reset example
          </Button>
          <Button onClick={onInsertClick} disabled={!text.trim()}>
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
