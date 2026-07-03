"use client";
import { Button } from "@/components/ui/button";
import { createBoard } from "@/app/actions/board";
import { useApiMutation } from "@/hooks/use-api-mutation";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EmptyBoardsProps {
  orgId: string;
}

export const EmptyBoards = ({ orgId }: EmptyBoardsProps) => {
  const router = useRouter();
  const { mutate, pending } = useApiMutation(createBoard);

  const onClick = () => {
    mutate({ title: "Untitled", orgId })
      .then((id) => {
        toast.success("Whiteboard created!");
        router.push(`/board/${id}`);
      })
      .catch(() => toast.error("Failed to create Whiteboard!"));
  };

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <Image src={"/note.svg"} height={110} width={110} alt="Empty" />
      <h2 className="text-2xl font-semibold mt-6">
        Create your first Whiteboard!
      </h2>
      <p className="text-muted-foreground text-sm mt-2 ">
        Start by creating a Whiteboard for your team
      </p>
      <div className="mt-6">
        <Button disabled={pending} size={"lg"} onClick={onClick}>
          Create Whiteboard
        </Button>
      </div>
    </div>
  );
};
