"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  X,
  Send,
  Workflow,
  Presentation as PresentationIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { generateFlowchart, generatePresentation } from "@/app/actions/ai";
import { flowchartToLayers, type PositionedLayer } from "@/lib/flowchart-layout";
import { presentationToLayers } from "@/lib/presentation-build";
import { cn } from "@/lib/utils";

type Mode = "diagram" | "presentation";
interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

interface AiChatPanelProps {
  open: boolean;
  onClose: () => void;
  origin: () => { x: number; y: number };
  onInsert: (layers: PositionedLayer[]) => void;
  onReplace: (prevIds: string[], layers: PositionedLayer[]) => void;
}

const DIAGRAM_EXAMPLES = [
  "User login flow with 2FA",
  "ERD for a blog app",
  "CI/CD pipeline",
];
const DECK_EXAMPLES = [
  "Pitch deck for a food delivery startup",
  "Intro to machine learning",
  "Q3 marketing plan",
];

export function AiChatPanel({
  open,
  onClose,
  origin,
  onInsert,
  onReplace,
}: AiChatPanelProps) {
  const [mode, setMode] = useState<Mode>("diagram");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const idRef = useRef(0);
  const diagramSpecRef = useRef("");
  const lastIdsRef = useRef<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const nextId = () => ++idRef.current;
  const push = (role: ChatMessage["role"], text: string) =>
    setMessages((m) => [...m, { id: nextId(), role, text }]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || loading) return;
    push("user", prompt);
    setInput("");
    setLoading(true);
    try {
      if (mode === "diagram") {
        // Accumulate the spec so follow-ups refine the same diagram.
        diagramSpecRef.current = diagramSpecRef.current
          ? `${diagramSpecRef.current}\nAlso: ${prompt}`
          : prompt;
        const graph = await generateFlowchart({
          prompt: diagramSpecRef.current,
        });
        const layers = flowchartToLayers(graph, origin());
        if (lastIdsRef.current.length) {
          onReplace(lastIdsRef.current, layers);
        } else {
          onInsert(layers);
        }
        lastIdsRef.current = layers.map((l) => l.id);
        push(
          "assistant",
          `Updated the diagram — ${graph.nodes.length} nodes, ${graph.edges.length} connections. Ask me to tweak it further.`
        );
      } else {
        const deck = await generatePresentation({ prompt });
        const layers = presentationToLayers(deck, origin());
        onInsert(layers);
        lastIdsRef.current = [];
        diagramSpecRef.current = "";
        push(
          "assistant",
          `Created "${deck.title}" — ${deck.slides.length} slides. Open the menu → Present frames to play it.`
        );
      }
    } catch (err) {
      push(
        "assistant",
        `⚠️ ${(err as Error)?.message ?? "Something went wrong."}`
      );
      toast.error((err as Error)?.message ?? "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    lastIdsRef.current = [];
    diagramSpecRef.current = "";
  };

  const examples = mode === "diagram" ? DIAGRAM_EXAMPLES : DECK_EXAMPLES;

  return (
    <div
      className={cn(
        "fixed top-0 right-0 z-40 h-full w-full sm:w-[380px] bg-white dark:bg-neutral-900 border-l dark:border-neutral-800 shadow-2xl flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b dark:border-neutral-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-sm">AI Assistant</p>
          <p className="text-[11px] text-muted-foreground">
            Diagrams & presentations
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto rounded-md p-1.5 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-2 border-b dark:border-neutral-800">
        {(
          [
            { m: "diagram", label: "Diagram", icon: Workflow },
            { m: "presentation", label: "Presentation", icon: PresentationIcon },
          ] as const
        ).map(({ m, label, icon: Icon }) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition",
              mode === m
                ? "bg-indigo-500 text-white"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="mt-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">
                {mode === "diagram"
                  ? "Describe a diagram"
                  : "Describe a presentation"}
              </p>
              <p className="text-xs text-muted-foreground px-4 mt-1">
                {mode === "diagram"
                  ? "I'll build it on your canvas. Then chat to refine it."
                  : "I'll generate slides as frames you can present."}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 px-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  className="rounded-lg border dark:border-neutral-700 px-3 py-2 text-left text-sm hover:bg-muted transition"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-indigo-500 text-white rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "diagram" ? "Drawing…" : "Building slides…"}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t dark:border-neutral-800 p-3">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={
              mode === "diagram"
                ? messages.length
                  ? "Refine the diagram…"
                  : "Describe a diagram…"
                : "Describe a presentation…"
            }
            rows={2}
            disabled={loading}
            className="resize-none pr-11"
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
