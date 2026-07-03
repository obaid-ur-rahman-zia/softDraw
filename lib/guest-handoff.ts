import type { Layer } from "@/types/canvas";

export interface BoardSnapshot {
  layers: Record<string, Layer>;
  layerIds: string[];
}

const IMPORT_PREFIX = "softdraw:import:";

/** Stash a guest board's contents to import into a freshly-created board room. */
export function stashImport(boardId: string, snapshot: BoardSnapshot) {
  try {
    localStorage.setItem(IMPORT_PREFIX + boardId, JSON.stringify(snapshot));
  } catch {
    // ignore quota errors
  }
}

/** Read and remove a pending import for a board (one-shot). */
export function takeImport(boardId: string): BoardSnapshot | null {
  try {
    const raw = localStorage.getItem(IMPORT_PREFIX + boardId);
    if (!raw) return null;
    localStorage.removeItem(IMPORT_PREFIX + boardId);
    const parsed = JSON.parse(raw) as BoardSnapshot;
    if (parsed && parsed.layers && Array.isArray(parsed.layerIds)) return parsed;
  } catch {
    // ignore
  }
  return null;
}
