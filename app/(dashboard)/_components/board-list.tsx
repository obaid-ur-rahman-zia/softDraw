import { getBoards } from "@/lib/queries";
import { EmptyBoards } from "./empty-boards";
import { EmptyFavourites } from "./empty-favourites";
import { EmptySearch } from "./empty-search";
import BoardCard, { BoardCardSkeleton } from "./board-card";
import NewBoardButton from "./new-board-button";

interface BoardListProps {
  orgId: string;
  userId: string;
  query: {
    search?: string;
    favourites?: string;
  };
}

const gridClass =
  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10";

export const BoardList = async ({ orgId, userId, query }: BoardListProps) => {
  const data = await getBoards(orgId, userId, {
    search: query.search,
    favourites: !!query.favourites,
  });

  if (!data.length && query.search) return <EmptySearch />;
  if (!data.length && query.favourites) return <EmptyFavourites />;
  if (!data.length) return <EmptyBoards orgId={orgId} />;

  return (
    <div className="text-3xl">
      <h2>{query.favourites ? "Favourite" : "Team"} whiteboards</h2>
      <div className={gridClass}>
        <NewBoardButton orgId={orgId} />
        {data.map((board) => (
          <BoardCard
            key={board.id}
            id={board.id}
            title={board.title}
            authorId={board.authorId}
            imageUrl={board.imageUrl}
            authorName={board.authorName}
            createdAt={board.createdAt}
            orgId={board.orgId}
            isFavourite={board.isFavourite}
            currentUserId={userId}
          />
        ))}
      </div>
    </div>
  );
};

export const BoardListSkeleton = ({
  orgId,
  favourites,
}: {
  orgId: string;
  favourites?: boolean;
}) => (
  <div className="text-3xl">
    <h2>{favourites ? "Favourite" : "Team"} whiteboards</h2>
    <div className={gridClass}>
      <NewBoardButton orgId={orgId} disabled />
      <BoardCardSkeleton />
      <BoardCardSkeleton />
      <BoardCardSkeleton />
      <BoardCardSkeleton />
    </div>
  </div>
);
