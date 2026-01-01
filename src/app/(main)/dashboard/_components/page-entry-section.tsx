import { Skeleton } from "@/components/ui/skeleton";
import { getTagDimensionStats } from "../lib/queries";
import { PageEntryWrapper } from "./page-entry-wrapper";

interface PageEntrySectionProps {
  from?: string | null;
  to?: string | null;
}

export async function PageEntrySection({ from, to }: PageEntrySectionProps) {
  const tagStats = await getTagDimensionStats({ from, to });

  return <PageEntryWrapper data={tagStats.pageEntry} />;
}

export function PageEntrySectionSkeleton() {
  return <Skeleton className="h-[300px] w-full rounded-xl" />;
}
