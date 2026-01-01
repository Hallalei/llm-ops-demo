"use client";

import type { TagDimensionStats } from "../lib/queries";
import { useDashboard } from "./dashboard-context";
import { IntentDistributionCard } from "./intent-distribution-card";
import { IssuesStatsCard } from "./issues-stats-card";
import { LanguageDistributionCard } from "./language-distribution-card";
import { PageEntryCard } from "./page-entry-card";
import { PlatformDistributionCard } from "./platform-distribution-card";
import { UserFeedbackCard } from "./user-feedback-card";

interface ChartsInteractiveWrapperProps {
  tagStats: TagDimensionStats;
  categoryCounts: Record<string, number>;
  languageCounts: Record<string, number>;
}

export function ChartsInteractiveWrapper({
  tagStats,
  categoryCounts,
  languageCounts,
}: ChartsInteractiveWrapperProps) {
  const { onFilterClick } = useDashboard();

  return (
    <div className="flex flex-col gap-4">
      {/* 第一行：4列分布卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PlatformDistributionCard
          data={tagStats.platform}
          onFilterClick={onFilterClick}
        />
        <UserFeedbackCard
          feedback={tagStats.feedback}
          onFilterClick={onFilterClick}
        />
        <IssuesStatsCard
          issues={tagStats.issues}
          onFilterClick={onFilterClick}
        />
        <LanguageDistributionCard
          data={languageCounts}
          onFilterClick={onFilterClick}
        />
      </div>
      {/* 第二行：2列条形图卡片 */}
      <div className="grid gap-4 md:grid-cols-2">
        <IntentDistributionCard
          data={categoryCounts}
          onFilterClick={onFilterClick}
        />
        <PageEntryCard
          data={tagStats.pageEntry}
          onFilterClick={onFilterClick}
        />
      </div>
    </div>
  );
}
