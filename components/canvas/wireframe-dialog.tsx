"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { wireframeToCode } from "@/app/actions/ai";
import { Loader2, Copy, Download, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

interface WireframeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Capture the current canvas as a PNG data URL. */
  capture: () => Promise<string | null>;
}

export function WireframeDialog({
  open,
  onOpenChange,
  capture,
}: WireframeDialogProps) {
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"preview" | "code">("preview");

  const generate = async () => {
    setLoading(true);
    setCode("");
    try {
      const image = await capture();
      if (!image) {
        toast.error("Draw a wireframe on the canvas first.");
        return;
      }
      const result = await wireframeToCode({ image, hint });
      setCode(result);
      setTab("preview");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadHtml = () => {
    const blob = new Blob([code], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wireframe.html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Wireframe to code</DialogTitle>
          <DialogDescription>
            Turns your current canvas sketch into a working HTML + Tailwind page
            using AI.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Optional: describe the page (e.g. 'SaaS landing page, dark theme')"
            disabled={loading}
          />
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>

        {code && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border p-0.5 text-sm">
                <button
                  className={`px-3 py-1 rounded ${tab === "preview" ? "bg-muted font-medium" : ""}`}
                  onClick={() => setTab("preview")}
                >
                  Preview
                </button>
                <button
                  className={`px-3 py-1 rounded ${tab === "code" ? "bg-muted font-medium" : ""}`}
                  onClick={() => setTab("code")}
                >
                  Code
                </button>
              </div>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={downloadHtml}>
                  <Download className="h-4 w-4" /> .html
                </Button>
              </div>
            </div>

            {tab === "preview" ? (
              <iframe
                title="Wireframe preview"
                srcDoc={code}
                className="h-[420px] w-full rounded-md border bg-white"
                sandbox="allow-scripts"
              />
            ) : (
              <textarea
                readOnly
                value={code}
                className="h-[420px] w-full resize-none rounded-md border bg-muted/40 p-3 font-mono text-xs"
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
