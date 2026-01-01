import { connection } from "next/server";
import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shared/shell";
import { getCategoryOptions } from "@/lib/classification/config";
import { getValidFilters } from "@/lib/data-table";
import { getLanguageOptions } from "@/lib/language-detection/config";
import type { SearchParams } from "@/types";
import { ConversationsTable } from "./_components/conversations-table";
import {
  getCategoryCounts,
  getConversations,
  getEnvCounts,
  getLanguageCounts,
} from "./_lib/queries";
import { searchParamsCache } from "./_lib/validations";

interface TracesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function TracesPage(props: TracesPageProps) {
  return (
    <Shell>
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={10}
            filterCount={3}
            cellWidths={[
              "3rem",
              "4rem",
              "10rem",
              "20rem",
              "25rem",
              "5rem",
              "10rem",
              "5rem",
              "6rem",
              "3rem",
            ]}
            shrinkZero
          />
        }
      >
        <ConversationsTableWrapper {...props} />
      </Suspense>
    </Shell>
  );
}

async function ConversationsTableWrapper(props: TracesPageProps) {
  // Ensure dynamic rendering for database queries
  await connection();

  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);
  const validFilters = getValidFilters(search.filters);

  const promises = Promise.all([
    getConversations({
      ...search,
      filters: validFilters,
    }),
    getEnvCounts(),
    getCategoryCounts(),
    getCategoryOptions(),
    getLanguageCounts(),
    getLanguageOptions(),
  ]);

  return <ConversationsTable promises={promises} />;
}
