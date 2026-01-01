"use client";

import { useDashboard } from "./dashboard-context";
import { PageEntryCard } from "./page-entry-card";

interface PageEntryWrapperProps {
  data: Record<string, number>;
}

export function PageEntryWrapper({ data }: PageEntryWrapperProps) {
  const { onFilterClick } = useDashboard();

  return <PageEntryCard data={data} onFilterClick={onFilterClick} />;
}
