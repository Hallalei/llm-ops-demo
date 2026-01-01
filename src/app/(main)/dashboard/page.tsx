import { connection } from "next/server";
import { Suspense } from "react";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { Shell } from "@/components/shared/shell";
import type { SearchParams } from "@/types";
import {
  ChartsSection,
  ChartsSectionSkeleton,
} from "./_components/charts-section";
import { DashboardShell } from "./_components/dashboard-shell";
import {
  StatsSection,
  StatsSectionSkeleton,
} from "./_components/stats-section";
import {
  UnifiedTrendSection,
  UnifiedTrendSectionSkeleton,
} from "./_components/unified-trend-section";
import { dashboardSearchParamsCache } from "./lib/validations";

interface DashboardPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const { from, to } = dashboardSearchParamsCache.parse(searchParams);

  await connection();

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl tracking-tight">仪表盘</h1>
            <p className="text-muted-foreground">系统运行数据概览</p>
          </div>
          <DateRangePicker />
        </div>

        <DashboardShell from={from} to={to}>
          <div className="flex flex-col gap-6">
            <Suspense fallback={<StatsSectionSkeleton />}>
              <StatsSection from={from} to={to} />
            </Suspense>

            <Suspense fallback={<ChartsSectionSkeleton />}>
              <ChartsSection from={from} to={to} />
            </Suspense>

            <Suspense fallback={<UnifiedTrendSectionSkeleton />}>
              <UnifiedTrendSection from={from} to={to} />
            </Suspense>
          </div>
        </DashboardShell>
      </div>
    </Shell>
  );
}
