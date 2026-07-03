"use client";

import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider, useStorage } from "@/liveblocks.config";
import { Layer } from "@/types/canvas";
import { ClientSideSuspense } from "@liveblocks/react";
import { ReactNode } from "react";

interface RoomProps {
  children: ReactNode;
  roomId: string;
  fallback: NonNullable<ReactNode> | null;
}

/**
 * Renders children only once the room's storage has actually loaded (room
 * connected + synced). Prevents "mutation cannot be used until connected"
 * errors from early interaction while the socket is still connecting.
 */
const RoomGate = ({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: NonNullable<ReactNode> | null;
}) => {
  const ready = useStorage((root) => root.layerIds != null);
  if (!ready) return <>{fallback}</>;
  return <>{children}</>;
};

export const Room = ({ children, roomId, fallback }: RoomProps) => {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        selection: [],
        pencilDraft: null,
        penColor: null,
      }}
      initialStorage={{
        layers: new LiveMap<string, LiveObject<Layer>>(),
        layerIds: new LiveList([]),
      }}
    >
      <ClientSideSuspense fallback={fallback}>
        {() => <RoomGate fallback={fallback}>{children}</RoomGate>}
      </ClientSideSuspense>
    </RoomProvider>
  );
};
