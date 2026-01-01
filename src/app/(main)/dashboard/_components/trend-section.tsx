import { Skeleton } from "@/components/ui/skeleton";
import { getDailyTrend } from "../lib/queries";
import { DailyTrendChart } from "./daily-trend-chart";

interface TrendSectionProps {
  from?: string | null;
  to?: string | null;
}

// 临时函数：将 from/to 转换为 days，返回 0 表示"全部"
function getDaysFromDateRange(
  from?: string | null,
  to?: string | null,
): number {
  if (!from || !to) return 0;
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

export async function TrendSection({ from, to }: TrendSectionProps) {
  const days = getDaysFromDateRange(from, to);
  const dailyTrend = await getDailyTrend({ from, to });
  return <DailyTrendChart data={dailyTrend} days={days} />;
}

export function TrendSectionSkeleton() {
  return <Skeleton className="h-[400px] w-full rounded-xl" />;
}
