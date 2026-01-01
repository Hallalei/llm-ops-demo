import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shared/shell";
import type { SearchParams } from "@/types";
import { SessionsTable } from "./_components/sessions-table";
import { getSessions } from "./lib/queries";
import { sessionsSearchParamsCache } from "./lib/validations";

interface SessionsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function SessionsPage(props: SessionsPageProps) {
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">会话列表</h1>
          <p className="text-muted-foreground">
            按会话 ID 分组的对话记录，点击查看完整对话历史
          </p>
        </div>
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={7}
              filterCount={2}
              cellWidths={[
                "3rem",
                "12rem",
                "8rem",
                "6rem",
                "10rem",
                "10rem",
                "5rem",
              ]}
              shrinkZero
            />
          }
        >
          <SessionsTableWrapper {...props} />
        </Suspense>
      </div>
    </Shell>
  );
}

async function SessionsTableWrapper(props: SessionsPageProps) {
  const searchParams = await props.searchParams;
  const search = sessionsSearchParamsCache.parse(searchParams);
  const { data, pageCount } = await getSessions(search);

  return <SessionsTable data={data} pageCount={pageCount} />;
}
