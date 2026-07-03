"use client";

import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { removeBoard } from "@/app/actions/board";
import { ConfirmModal } from "./confirm-modal";
import { Button } from "./ui/button";
import { useRenameModal } from "@/store/use-rename-modal";

interface ActionsProps {
  children: React.ReactNode;
  side?: DropdownMenuContentProps["side"];
  sideOffset?: DropdownMenuContentProps["sideOffset"];
  id: string;
  title: string;
}

export const Actions = ({
  children,
  title,
  id,
  side,
  sideOffset,
}: ActionsProps) => {
  const { mutate, pending } = useApiMutation(removeBoard);
  const { onOpen } = useRenameModal()


  const onCopyLink = () => {
    navigator.clipboard
      .writeText(
        `
            ${window.location.origin}/board/${id}
        `
      )
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const onDelete = () => {
    mutate({
      id,
    })
      .then(() => toast.success("Whiteboard deleted"))
      .catch(() => toast.error("Failed to delete whiteboard"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={(e) => e.stopPropagation()}
        side={side}
        sideOffset={sideOffset}
        className="w-60"
      >
        <DropdownMenuItem className="p-3 cursor-pointer" onClick={onCopyLink}>
          <Link2 className="h-4 w-4 mr-2" />
          Copy whiteboard link
        </DropdownMenuItem>
        <DropdownMenuItem className="p-3 cursor-pointer" onClick={() => onOpen(id, title)}>
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <ConfirmModal
            header="Delete whiteboard?"
            description="This will delete the whiteboard and all its contents."
            disabled={pending}
            onConfirm={onDelete}
        >
          <Button
          variant={"ghost"}
          className="p-3 text-sm w-full justify-start font-normal cursor-pointer">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
