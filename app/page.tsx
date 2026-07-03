import { GuestBoard } from "@/components/draw/guest-board";

export const metadata = {
  title: "SoftDraw — Online Whiteboard",
  description:
    "A free, collaborative whiteboard. Start drawing instantly — no login needed. Sign in to save your work.",
};

export default function HomePage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <GuestBoard />
    </div>
  );
}
