// Transient hand-off so a just-created Text/Note layer can auto-focus for
// immediate typing (Excalidraw-style). Client-only, one-shot.
let pendingId: string | null = null;

export const requestTextFocus = (id: string) => {
  pendingId = id;
};

/** Returns true once for the layer that was requested, then clears it. */
export const consumeTextFocus = (id: string) => {
  if (pendingId === id) {
    pendingId = null;
    return true;
  }
  return false;
};
