import { GuestBoard } from "@/components/draw/guest-board";

export const metadata = {
  title: "Draw — SoftDraw",
  description: "Sketch on a free whiteboard. Sign in to save your work.",
};

export default function DrawPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <GuestBoard />
    </div>
  );
}
