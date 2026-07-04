"use server";

import OpenAI from "openai";
import { requireUser } from "@/lib/guards";

export type NodeShape =
  | "process"
  | "decision"
  | "terminal"
  | "database"
  | "entity";

export interface FlowchartNode {
  id: string;
  label: string;
  shape: NodeShape;
}
export interface FlowchartEdge {
  from: string;
  to: string;
  label: string;
}
export interface FlowchartGraph {
  direction: "TB" | "LR";
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

const DIAGRAM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    direction: { type: "string", enum: ["TB", "LR"] },
    nodes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          shape: {
            type: "string",
            enum: ["process", "decision", "terminal", "database", "entity"],
          },
        },
        required: ["id", "label", "shape"],
      },
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          label: { type: "string" },
        },
        required: ["from", "to", "label"],
      },
    },
  },
  required: ["direction", "nodes", "edges"],
} as const;

const SYSTEM_PROMPT = `You turn a natural-language request into a clean, well-structured diagram as a node/edge graph. Support any diagram type (flowchart, ERD, class diagram, use-case, state machine, org chart, sequence-of-steps, etc.).

Output rules:
- "direction": "TB" for top-to-bottom flows/hierarchies, "LR" for left-to-right pipelines/ERDs. Pick whichever reads best.
- Node "id": short unique slug (e.g. "user", "check_stock"). Every edge "from"/"to" MUST reference an existing node id.
- Node "shape":
  - "terminal" = start/end nodes (ovals).
  - "decision" = yes/no or branching points (diamonds).
  - "process" = a normal step / activity / actor (box).
  - "database" = a datastore.
  - "entity" = an ERD entity or a class. For entity/class nodes, put the name on the first line, then each attribute/field/method on its own line using "\\n". Example label: "User\\nid: int\\nname: string\\nemail: string".
- Edge "label": relationship or condition ("Yes"/"No", cardinality like "1..*", "has", "extends", or "" when none).
- Keep it correct and focused; model the real structure the user asked for. Do NOT overcrowd — split only what's needed.`;

export async function generateFlowchart({
  prompt,
}: {
  prompt: string;
}): Promise<FlowchartGraph> {
  await requireUser();

  const trimmed = prompt.trim();
  if (!trimmed) throw new Error("Describe the diagram you want.");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI is not configured. Add OPENAI_API_KEY to your environment."
    );
  }

  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: trimmed },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "diagram", schema: DIAGRAM_SCHEMA, strict: true },
    },
  });

  const message = response.choices[0]?.message;
  if (message?.refusal) throw new Error("The model declined this request.");
  const text = message?.content;
  if (!text) throw new Error("The model returned no diagram.");

  let graph: FlowchartGraph;
  try {
    graph = JSON.parse(text);
  } catch {
    throw new Error("Could not parse the generated diagram.");
  }

  if (!graph.nodes?.length) throw new Error("The model returned no nodes.");
  return graph;
}

export interface PresentationSlide {
  title: string;
  bullets: string[];
}
export interface Presentation {
  title: string;
  slides: PresentationSlide[];
}

const PRESENTATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["title", "bullets"],
      },
    },
  },
  required: ["title", "slides"],
} as const;

const PRESENTATION_SYSTEM_PROMPT = `You create clear, well-structured slide decks.
Rules:
- Return a "title" for the deck and 4–8 "slides".
- Each slide has a short "title" and 2–5 concise "bullets" (max ~12 words each).
- Start with a title/intro slide and end with a summary or takeaways slide.
- Keep it focused and logically ordered. No markdown, plain text bullets.`;

export async function generatePresentation({
  prompt,
}: {
  prompt: string;
}): Promise<Presentation> {
  await requireUser();
  const trimmed = prompt.trim();
  if (!trimmed) throw new Error("Describe the presentation you want.");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI is not configured. Add OPENAI_API_KEY to your environment."
    );
  }
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: PRESENTATION_SYSTEM_PROMPT },
      { role: "user", content: trimmed },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "presentation",
        schema: PRESENTATION_SCHEMA,
        strict: true,
      },
    },
  });
  const message = response.choices[0]?.message;
  if (message?.refusal) throw new Error("The model declined this request.");
  const text = message?.content;
  if (!text) throw new Error("The model returned no presentation.");
  let deck: Presentation;
  try {
    deck = JSON.parse(text);
  } catch {
    throw new Error("Could not parse the generated presentation.");
  }
  if (!deck.slides?.length) throw new Error("The model returned no slides.");
  return deck;
}

const WIREFRAME_SYSTEM_PROMPT = `You are an expert front-end engineer. You receive a screenshot of a hand-drawn wireframe / sketch of a UI and turn it into clean, production-ready code.

Rules:
- Produce a SINGLE self-contained HTML document that uses Tailwind CSS via the CDN script <script src="https://cdn.tailwindcss.com"></script> in the <head>. No other external assets.
- Faithfully reproduce the layout, sections, buttons, inputs, text, images (use placeholder blocks/labels), and overall hierarchy visible in the sketch.
- Use sensible, modern styling: spacing, rounded corners, subtle borders/shadows, a coherent color palette. Make it look polished, not just boxes.
- Use semantic HTML. Make it responsive with Tailwind utilities.
- Return ONLY the raw HTML code. No markdown fences, no explanation.`;

export async function wireframeToCode({
  image,
  hint,
}: {
  image: string;
  hint?: string;
}): Promise<string> {
  await requireUser();

  if (!image?.startsWith("data:image/")) {
    throw new Error("A wireframe image is required.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI is not configured. Add OPENAI_API_KEY to your environment."
    );
  }

  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: WIREFRAME_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: hint?.trim()
              ? `Turn this wireframe into a working page. Extra context: ${hint.trim()}`
              : "Turn this wireframe into a working page.",
          },
          { type: "image_url", image_url: { url: image, detail: "high" } },
        ],
      },
    ],
  });

  const message = response.choices[0]?.message;
  if (message?.refusal) throw new Error("The model declined this request.");
  let code = message?.content?.trim();
  if (!code) throw new Error("The model returned no code.");

  // Strip accidental markdown fences.
  code = code
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return code;
}
