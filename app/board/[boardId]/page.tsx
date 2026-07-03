import { redirect, notFound } from "next/navigation";
import { Room } from "@/components/room";
import Canvas from "./_components/canvas";
import Loading from "./_components/loading";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface BoardIdPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

const BoardIdPage = async ({ params }: BoardIdPageProps) => {
  const { boardId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) notFound();

  // Only members of the board's team may open it.
  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId: board.orgId } },
  });
  if (!membership) redirect("/");

  return (
    <Room roomId={boardId} fallback={<Loading />}>
      <Canvas boardId={boardId} boardTitle={board.title} />
    </Room>
  );
};

export default BoardIdPage;
