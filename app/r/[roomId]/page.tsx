import { Room } from "@/components/room";
import Canvas from "@/app/board/[boardId]/_components/canvas";
import Loading from "@/app/board/[boardId]/_components/loading";

export const metadata = {
  title: "Live collaboration — SoftDraw",
  description: "Draw together in real time.",
};

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

// Public, login-free collaborative room. Anyone with the link joins (the
// liveblocks-auth route grants anonymous access to "guest-" rooms).
export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return (
    <Room roomId={roomId} fallback={<Loading />}>
      <Canvas boardId={roomId} boardTitle="Live collaboration" guest />
    </Room>
  );
}
