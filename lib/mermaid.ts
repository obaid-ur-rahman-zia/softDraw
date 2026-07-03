import type {
  FlowchartGraph,
  FlowchartNode,
  FlowchartEdge,
} from "@/app/actions/ai";

/**
 * Lightweight Mermaid `graph`/`flowchart` parser — enough for common flowcharts.
 * Supports node shapes A[proc], A{decision}, A(round)/A((circle)) terminals,
 * and edges A-->B, A-->|label|B, A-- label -->B, A---B.
 */
export function parseMermaid(text: string): FlowchartGraph {
  const nodes = new Map<string, FlowchartNode>();
  const edges: FlowchartEdge[] = [];

  const ensure = (
    id: string,
    label?: string,
    shape?: FlowchartNode["shape"]
  ) => {
    const existing = nodes.get(id);
    if (existing) {
      if (label) existing.label = label;
      if (shape) existing.shape = shape;
      return id;
    }
    nodes.set(id, { id, label: label ?? id, shape: shape ?? "process" });
    return id;
  };

  const parseNode = (token: string): string => {
    const t = token.trim();
    const m = t.match(
      /^([A-Za-z0-9_-]+)\s*(?:\[([^\]]*)\]|\(\(([^)]*)\)\)|\(([^)]*)\)|\{([^}]*)\})?/
    );
    if (!m) return t;
    const id = m[1];
    if (m[5] != null) ensure(id, m[5].trim(), "decision");
    else if (m[3] != null) ensure(id, m[3].trim(), "terminal");
    else if (m[4] != null) ensure(id, m[4].trim(), "terminal");
    else if (m[2] != null) ensure(id, m[2].trim(), "process");
    else ensure(id);
    return id;
  };

  let direction: "TB" | "LR" = "TB";
  const dirMatch = text.match(/^\s*(?:graph|flowchart)\s+(TB|TD|BT|LR|RL)/im);
  if (dirMatch) direction = /LR|RL/i.test(dirMatch[1]) ? "LR" : "TB";

  const lines = text
    .split(/\r?\n|;/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (let raw of lines) {
    if (/^(graph|flowchart|subgraph|end)\b/i.test(raw)) continue;

    // Normalize "A-- label -->B" into "A-->|label|B".
    raw = raw.replace(/--\s*([^->|][^->]*?)\s*-->/g, (_, l) => `-->|${l.trim()}|`);

    const edge = raw.match(
      /^(.+?)\s*(?:-->|---|==>|-\.->)\s*(?:\|([^|]*)\|\s*)?(.+)$/
    );
    if (edge) {
      const from = parseNode(edge[1]);
      const to = parseNode(edge[3]);
      edges.push({ from, to, label: edge[2]?.trim() ?? "" });
    } else {
      parseNode(raw);
    }
  }

  return { direction, nodes: [...nodes.values()], edges };
}
