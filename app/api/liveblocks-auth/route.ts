import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 403 });
  }

  const { room } = await request.json();

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
