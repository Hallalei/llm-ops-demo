import { Skeleton } from "@/components/ui/skeleton";
import { getTokenUsageHistory } from "@/lib/openrouter";
import { TokenUsageChart } from "./token-usage-chart";

export async function TokenUsageSection({ days }: { days: number }) {
  const tokenUsage = await getTokenUsageHistory(days);
  return <TokenUsageChart data={tokenUsage} days={days} />;
}

export function TokenUsageSectionSkeleton() {
  return <Skeleton className="h-[400px] w-full rounded-xl" />;
}
