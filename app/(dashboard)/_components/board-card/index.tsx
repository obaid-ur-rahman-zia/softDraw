"use client";

import Image from "next/image";
import Link from "next/link";
import { Overlay } from "./overlay";
import { formatDistanceToNow } from "date-fns";
import Footer from "./footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Actions } from "@/components/actions";
import { MoreHorizontal } from "lucide-react";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { favouriteBoard, unfavouriteBoard } from "@/app/actions/board";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BoardCardProps {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  createdAt: number;
  imageUrl: string;
  orgId: string;
  isFavourite: boolean;
  currentUserId?: string;
}

const BoardCard = ({
  authorId,
  authorName,
  id,
  imageUrl,
  createdAt,
  isFavourite,
  orgId,
  title,
  currentUserId,
}: BoardCardProps) => {
  const router = useRouter();

  const authorLabel = currentUserId === authorId ? "You" : authorName;
  const createdAtLabel = formatDistanceToNow(createdAt, { addSuffix: true });

  const { mutate: onFavourite, pending: pendingFavourite } =
    useApiMutation(favouriteBoard);
  const { mutate: onUnfavourite, pending: pendingUnfavourite } =
    useApiMutation(unfavouriteBoard);

  const toggleFavourite = () => {
    if (isFavourite) {
      onUnfavourite({ id })
        .then(() => router.refresh())
        .catch(() => toast.error("Failed to unfavourite"));
    } else {
      onFavourite({ id, orgId })
        .then(() => router.refresh())
        .catch(() => toast.error("Failed to favourite"));
    }
  };

  return (
    <Link href={`/board/${id}`}>
      <div className="group aspect-[100/127] border rounded-lg flex flex-col justify-between overflow-hidden">
        <div className="flex-1 relative bg-amber-50">
          <Image src={imageUrl} alt={title} fill className="object-fit" />
          <Overlay />
          <Actions id={id} title={title} side="right">
            <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-2 outline-none">
              <MoreHorizontal className="text-white opacity-75 hover:opacity-100 transition-opacity" />
            </button>
          </Actions>
        </div>

        <Footer
          isFavourite={isFavourite}
          title={title}
          authorLabel={authorLabel}
          createdAtLabel={createdAtLabel}
          onClick={toggleFavourite}
          disabled={pendingFavourite || pendingUnfavourite}
        />
      </div>
    </Link>
  );
};

export default BoardCard;

// Named export so server components (board-list skeleton) can render it across
// the RSC boundary — a static `.Skeleton` property would be undefined there.
export const BoardCardSkeleton = () => {
  return (
    <div className="aspect-[100/127] rounded-lg overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  );
};

BoardCard.Skeleton = BoardCardSkeleton;
