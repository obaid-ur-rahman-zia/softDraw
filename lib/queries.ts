import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Current authenticated user (id/name/email/image) or null. */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export type OrgSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

/**
 * Resolves the signed-in user together with their organizations and the
 * active one (User.activeOrgId, falling back to the earliest membership).
 */
export async function getActiveContext() {
  const user = await getSessionUser();
  if (!user?.id) return null;

  const [memberships, dbUser] = await Promise.all([
    prisma.membership.findMany({
      where: { userId: user.id },
      include: { org: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { activeOrgId: true },
    }),
  ]);

  const orgs: OrgSummary[] = memberships.map((m) => ({
    id: m.org.id,
    name: m.org.name,
    imageUrl: m.org.imageUrl,
    role: m.role,
  }));

  const active =
    orgs.find((o) => o.id === dbUser?.activeOrgId) ?? orgs[0] ?? null;

  return { user, orgs, activeOrg: active };
}

export interface BoardListItem {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  imageUrl: string;
  orgId: string;
  createdAt: number;
  isFavourite: boolean;
}

/** Boards for an org, with per-user favourite flag. Mirrors the old convex/boards.get. */
export async function getBoards(
  orgId: string,
  userId: string,
  query: { search?: string; favourites?: boolean }
): Promise<BoardListItem[]> {
  if (query.favourites) {
    const favs = await prisma.favourite.findMany({
      where: { userId, orgId },
      include: { board: true },
      orderBy: { createdAt: "desc" },
    });
    return favs
      .filter((f) => f.board)
      .map((f) => ({
        id: f.board.id,
        title: f.board.title,
        authorId: f.board.authorId,
        authorName: f.board.authorName,
        imageUrl: f.board.imageUrl,
        orgId: f.board.orgId,
        createdAt: f.board.createdAt.getTime(),
        isFavourite: true,
      }));
  }

  const boards = await prisma.board.findMany({
    where: {
      orgId,
      ...(query.search
        ? { title: { contains: query.search, mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const favs = await prisma.favourite.findMany({
    where: { userId, orgId },
    select: { boardId: true },
  });
  const favSet = new Set(favs.map((f) => f.boardId));

  return boards.map((b) => ({
    id: b.id,
    title: b.title,
    authorId: b.authorId,
    authorName: b.authorName,
    imageUrl: b.imageUrl,
    orgId: b.orgId,
    createdAt: b.createdAt.getTime(),
    isFavourite: favSet.has(b.id),
  }));
}

export async function getBoardById(id: string) {
  return prisma.board.findUnique({ where: { id } });
}
