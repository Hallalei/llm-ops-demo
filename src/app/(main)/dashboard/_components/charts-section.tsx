import {
  getCategoryCounts,
  getLanguageCounts,
} from "@/app/(main)/traces/_lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { getTagDimensionStats } from "../lib/queries";
import { ChartsInteractiveWrapper } from "./charts-interactive-wrapper";

interface ChartsSectionProps {
  from?: string | null;
  to?: string | null;
}

// 临时函数：将 from/to 转换为 days，返回 undefined 表示"全部"
function getDaysFromDateRange(
  from?: string | null,
  to?: string | null,
): number | undefined {
  if (!from || !to) return undefined;
  const fromDate = new Date(from);
  let toDate = new Date(to);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (toDate > today) {
    toDate = today;
  }
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 7;
}

export async function ChartsSection({ from, to }: ChartsSectionProps) {
  const days = getDaysFromDateRange(from, to);

  const [tagStats, categoryCounts, languageCounts] = await Promise.all([
    getTagDimensionStats({ from, to }),
    getCategoryCounts(days),
    getLanguageCounts(days),
  ]);

  return (
    <ChartsInteractiveWrapper
      tagStats={tagStats}
      categoryCounts={categoryCounts}
      languageCounts={languageCounts}
    />
  );
}

export function ChartsSectionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* 第一行：4列 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[180px] rounded-xl" />
        <Skeleton className="h-[180px] rounded-xl" />
        <Skeleton className="h-[180px] rounded-xl" />
        <Skeleton className="h-[180px] rounded-xl" />
      </div>
      {/* 第二行：2列 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[220px] rounded-xl" />
        <Skeleton className="h-[220px] rounded-xl" />
      </div>
    </div>
  );
}
