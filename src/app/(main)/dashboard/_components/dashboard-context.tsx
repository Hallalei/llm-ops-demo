"use client";

import * as React from "react";
import type { FilterClickHandler } from "./types";

interface DashboardContextValue {
  onFilterClick: FilterClickHandler;
}

const DashboardContext = React.createContext<DashboardContextValue | null>(
  null,
);

export function useDashboard() {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardShell");
  }
  return context;
}

export const DashboardProvider = DashboardContext.Provider;
