"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOrgMembership } from "@/lib/guards";
import { getActiveContext } from "@/lib/queries";

const images = [
  "/placeholder/1.svg",
  "/placeholder/2.svg",
  "/placeholder/3.svg",
  "/placeholder/4.svg",
  "/placeholder/5.svg",
];

export async function createBoard({
  orgId,
  title,
}: {
  orgId: string;
  title: string;
}) {
  const { user } = await requireOrgMembership(orgId);

  const board = await prisma.board.create({
    data: {
      title: title?.trim() || "Untitled",
      orgId,
      authorId: user.id,
      authorName: user.name ?? "Anonymous",
      imageUrl: images[Math.floor(Math.random() * images.length)],
    },
  });

  revalidatePath("/");
  return board.id;
}

/**
 * Creates a board in the user's active team so a guest whiteboard can be saved.
 * The canvas layers are handed off client-side (localStorage) and imported when
 * the board opens — see the import effect in canvas.tsx.
 */
export async function saveGuestBoard({ title }: { title?: string }) {
  const ctx = await getActiveContext();
  if (!ctx?.activeOrg) {
    throw new Error("No team found. Create a team first.");
  }
  return createBoard({ orgId: ctx.activeOrg.id, title: title || "Untitled" });
}

export async function removeBoard({ id }: { id: string }) {
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) throw new Error("Board not found");
  await requireOrgMembership(board.orgId);

  // Favourites cascade via schema, but delete explicitly to be safe.
  await prisma.board.delete({ where: { id } });
  revalidatePath("/");
}

export async function updateBoard({ id, title }: { id: string; title: string }) {
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) throw new Error("Board not found");
  await requireOrgMembership(board.orgId);

  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required!");
  if (trimmed.length > 60)
    throw new Error("Title cannot be longer than 60 characters!");

  await prisma.board.update({ where: { id }, data: { title: trimmed } });
  revalidatePath("/");
  revalidatePath(`/board/${id}`);
}

export async function favouriteBoard({
  id,
  orgId,
}: {
  id: string;
  orgId: string;
}) {
  const user = await requireUser();
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) throw new Error("Whiteboard not found");

  await prisma.favourite.upsert({
    where: { userId_boardId: { userId: user.id, boardId: id } },
    create: { userId: user.id, boardId: id, orgId },
    update: {},
  });
  revalidatePath("/");
}

export async function unfavouriteBoard({ id }: { id: string }) {
  const user = await requireUser();
  await prisma.favourite
    .delete({ where: { userId_boardId: { userId: user.id, boardId: id } } })
    .catch(() => {
      throw new Error("Favourited whiteboard not found!");
    });
  revalidatePath("/");
}
