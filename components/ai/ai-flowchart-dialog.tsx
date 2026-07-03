"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateFlowchart } from "@/app/actions/ai";
import { flowchartToLayers, type PositionedLayer } from "@/lib/flowchart-layout";

interface AiFlowchartDialogProps {
  onInsert: (layers: PositionedLayer[]) => void;
  /** Returns the canvas-space point to centre the diagram on. */
  origin: () => { x: number; y: number };
  /** Controlled mode — when provided, no trigger button is rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const EXAMPLES = [
  "User login flow with two-factor authentication",
  "ERD for a blog: users, posts, comments, tags",
  "Class diagram for an e-commerce cart system",
  "CI pipeline: build, test, then deploy on success",
];

export function AiFlowchartDialog({
  onInsert,
  origin,
  open,
  onOpenChange,
  hideTrigger,
}: AiFlowchartDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : internalOpen;
  const setOpen = (o: boolean) =>
    isControlled ? onOpenChange?.(o) : setInternalOpen(o);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const onGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const graph = await generateFlowchart({ prompt });
      onInsert(flowchartToLayers(graph, origin()));
      toast.success("Diagram added to the canvas!");
      setOpen(false);
      setPrompt("");
    } catch (err) {
      toast.error((err as Error)?.message ?? "Failed to generate diagram");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={actualOpen} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="shadow-md gap-x-2">
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-x-2">
            <Sparkles className="h-4 w-4" /> Generate a diagram
          </DialogTitle>
          <DialogDescription>
            Describe any diagram — flowchart, ERD, class diagram, use-case — and
            AI lays it out on your canvas.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A support ticket workflow from submission to resolution"
          rows={4}
          disabled={loading}
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => setPrompt(ex)}
              className="text-xs rounded-full border px-3 py-1 text-muted-foreground hover:bg-muted transition"
            >
              {ex}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button disabled={loading || !prompt.trim()} onClick={onGenerate}>
            {loading ? "Generating…" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
