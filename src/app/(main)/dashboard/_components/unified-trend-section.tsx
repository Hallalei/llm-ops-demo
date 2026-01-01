import { Skeleton } from "@/components/ui/skeleton";
import { getTokenUsageHistory } from "@/lib/openrouter";
import { getDailyTrend } from "../lib/queries";
import { UnifiedTrendChart } from "./unified-trend-chart";

interface UnifiedTrendSectionProps {
  from?: string | null;
  to?: string | null;
}

// 临时函数：将 from/to 转换为 days，以兼容旧的查询函数
// 返回 0 表示"全部"数据
function getDaysFromDateRange(
  from?: string | null,
  to?: string | null,
): number {
  // 没有日期参数表示"全部"，返回 0
  if (!from || !to) return 0;
  const fromDate = new Date(from);
  let toDate = new Date(to);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  // 如果 to 日期超过今天，截断到今天，避免请求未来日期
  if (toDate > today) {
    toDate = today;
  }
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 7;
}

export async function UnifiedTrendSection({
  from,
  to,
}: UnifiedTrendSectionProps) {
  const days = getDaysFromDateRange(from, to);

  const [tokenData, traceData] = await Promise.all([
    getTokenUsageHistory(days),
    getDailyTrend({ from, to }),
  ]);

  return (
    <UnifiedTrendChart
      tokenData={tokenData}
      traceData={traceData}
      days={days}
    />
  );
}

export function UnifiedTrendSectionSkeleton() {
  return <Skeleton className="h-[420px] w-full rounded-xl" />;
}
