"use client";

import { useCallback, useEffect, useState } from "react";
import { Layer } from "@/types/canvas";

export interface LocalSnapshot {
  layers: Record<string, Layer>;
  layerIds: string[];
}

interface Store {
  present: LocalSnapshot;
  past: LocalSnapshot[];
  future: LocalSnapshot[];
}

const STORAGE_KEY = "softdraw:guest-board";
const MAX_HISTORY = 100;

const empty = (): LocalSnapshot => ({ layers: {}, layerIds: [] });

/**
 * Local, offline board state for the guest whiteboard. Same conceptual surface
 * as Liveblocks storage (layers map + ordered ids) plus undo/redo, persisted to
 * localStorage. `pushHistory` + `mutateLive` model paused-history gestures
 * (drag/resize); `mutate` is a single undoable step.
 */
export function useLocalBoard() {
  const [store, setStore] = useState<Store>(() => ({
    present: empty(),
    past: [],
    future: [],
  }));
  const [loaded, setLoaded] = useState(false);

  // Load persisted board after mount (avoids SSR/client hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalSnapshot;
        if (parsed && parsed.layers && Array.isArray(parsed.layerIds)) {
          setStore({ present: parsed, past: [], future: [] });
        }
      }
    } catch {
      // ignore corrupt data
    }
    setLoaded(true);
  }, []);

  // Persist present after it's loaded.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.present));
    } catch {
      // ignore quota errors
    }
  }, [store.present, loaded]);

  const pushHistory = useCallback(() => {
    setStore((s) => ({
      ...s,
      past: [...s.past.slice(-(MAX_HISTORY - 1)), s.present],
      future: [],
    }));
  }, []);

  const mutateLive = useCallback(
    (updater: (prev: LocalSnapshot) => LocalSnapshot) => {
      setStore((s) => ({ ...s, present: updater(s.present) }));
    },
    []
  );

  const mutate = useCallback(
    (updater: (prev: LocalSnapshot) => LocalSnapshot) => {
      setStore((s) => ({
        past: [...s.past.slice(-(MAX_HISTORY - 1)), s.present],
        future: [],
        present: updater(s.present),
      }));
    },
    []
  );

  const undo = useCallback(() => {
    setStore((s) => {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        present: prev,
        future: [s.present, ...s.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setStore((s) => {
      if (!s.future.length) return s;
      const next = s.future[0];
      return {
        past: [...s.past, s.present],
        present: next,
        future: s.future.slice(1),
      };
    });
  }, []);

  const clear = useCallback(() => {
    setStore({ present: empty(), past: [], future: [] });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    present: store.present,
    canUndo: store.past.length > 0,
    canRedo: store.future.length > 0,
    loaded,
    pushHistory,
    mutate,
    mutateLive,
    undo,
    redo,
    clear,
  };
}
