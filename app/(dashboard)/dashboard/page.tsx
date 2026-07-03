import { Suspense } from "react";
import EmptyOrg from "./_components/empty-org";
import { BoardList, BoardListSkeleton } from "./_components/board-list";
import { getActiveContext } from "@/lib/queries";

interface DashboardPageProps {
  searchParams: Promise<{
    search?: string;
    favourites?: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const ctx = await getActiveContext();
  const params = await searchParams;

  return (
    <div className="flex-1 h-[calc(100%-80px)] p-6">
      {!ctx?.activeOrg ? (
        <EmptyOrg />
      ) : (
        <Suspense
          key={JSON.stringify(params)}
          fallback={
            <BoardListSkeleton
              orgId={ctx.activeOrg.id}
              favourites={!!params.favourites}
            />
          }
        >
          <BoardList
            orgId={ctx.activeOrg.id}
            userId={ctx.user.id}
            query={params}
          />
        </Suspense>
      )}
    </div>
  );
};

export default DashboardPage;
