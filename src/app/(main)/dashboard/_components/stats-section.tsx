import { Skeleton } from "@/components/ui/skeleton";
import { getLast24hTokenStats } from "@/lib/openrouter";
import { getFixedStatsWithTrend } from "../lib/queries";
import { StatsCards } from "./stats-cards";

interface StatsSectionProps {
  from?: string | null;
  to?: string | null;
}

export async function StatsSection({ from, to }: StatsSectionProps) {
  const [stats, tokenStats] = await Promise.all([
    getFixedStatsWithTrend({ from, to }),
    getLast24hTokenStats(),
  ]);
  return <StatsCards stats={stats} tokenStats={tokenStats} />;
}

export function StatsSectionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}
