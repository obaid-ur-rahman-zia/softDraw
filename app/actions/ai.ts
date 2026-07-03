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
