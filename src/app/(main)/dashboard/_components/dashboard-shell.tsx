"use client";

import * as React from "react";
import { DashboardProvider } from "./dashboard-context";
import { TraceListDialog } from "./trace-list-dialog";
import type { FilterClickHandler } from "./types";

interface DialogState {
  open: boolean;
  filterType: string;
  filterValue: string;
  title: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
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

export function DashboardShell({ children, from, to }: DashboardShellProps) {
  const [dialogState, setDialogState] = React.useState<DialogState>({
    open: false,
    filterType: "",
    filterValue: "",
    title: "",
  });

  const days = getDaysFromDateRange(from, to);

  const handleFilterClick: FilterClickHandler = (
    filterType,
    filterValue,
    title,
  ) => {
    setDialogState({
      open: true,
      filterType,
      filterValue,
      title,
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDialogState((prev) => ({ ...prev, open: false }));
    }
  };

  return (
    <DashboardProvider value={{ onFilterClick: handleFilterClick }}>
      {children}
      <TraceListDialog
        open={dialogState.open}
        onOpenChange={handleDialogOpenChange}
        title={dialogState.title}
        filterType={dialogState.filterType}
        filterValue={dialogState.filterValue}
        days={days}
      />
    </DashboardProvider>
  );
}
