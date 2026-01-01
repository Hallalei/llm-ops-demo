import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shared/shell";
import type { SearchParams } from "@/types";
import { UsersTable } from "./_components/users-table";
import { getUsers } from "./lib/queries";
import { usersSearchParamsCache } from "./lib/validations";

interface UsersPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function UsersPage(props: UsersPageProps) {
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">用户列表</h1>
          <p className="text-muted-foreground">
            按用户 ID 聚合的对话统计，点击查看用户详情
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
                "6rem",
                "6rem",
                "10rem",
                "10rem",
                "3rem",
              ]}
              shrinkZero
            />
          }
        >
          <UsersTableWrapper {...props} />
        </Suspense>
      </div>
    </Shell>
  );
}

async function UsersTableWrapper(props: UsersPageProps) {
  const searchParams = await props.searchParams;
  const search = usersSearchParamsCache.parse(searchParams);
  const { data, pageCount } = await getUsers(search);

  return <UsersTable data={data} pageCount={pageCount} />;
}
