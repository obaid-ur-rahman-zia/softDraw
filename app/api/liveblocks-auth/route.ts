import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Liveblocks } from "@liveblocks/node";
import { randomUUID } from "crypto";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

/** Rooms whose id starts with this are public guest collaboration rooms — the
 * link/QR is the only credential (Excalidraw-style). Anyone can join & edit. */
const GUEST_ROOM_PREFIX = "guest-";

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export async function POST(request: Request) {
  const { room } = await request.json();

  // ── Public guest collaboration room: anyone with the link may join. ──
  if (typeof room === "string" && room.startsWith(GUEST_ROOM_PREFIX)) {
    const name = readCookie(request, "sd_name") || "Guest";
    const guestId = `guest_${randomUUID()}`;
    const guestSession = liveblocks.prepareSession(guestId, {
      userInfo: { name },
    });
    guestSession.allow(room, guestSession.FULL_ACCESS);
    const { status, body } = await guestSession.authorize();
    return new Response(body, { status });
  }

  // ── Saved team board: require login + team membership. ──
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 403 });
  }

  const board = await prisma.board.findUnique({ where: { id: room } });
  if (!board) {
    return new Response("Unauthorized", { status: 403 });
  }

  // The user must belong to the board's team.
  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: { userId: session.user.id, orgId: board.orgId },
    },
  });
  if (!membership) {
    return new Response("Unauthorized", { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });

  const userInfo = {
    name: dbUser?.name || session.user.name || "Anonymous",
    picture: dbUser?.image || session.user.image || undefined,
  };

  const liveblocksSession = liveblocks.prepareSession(session.user.id, {
    userInfo,
  });

  if (room) {
    liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
  }

  const { status, body } = await liveblocksSession.authorize();
  return new Response(body, { status });
}
