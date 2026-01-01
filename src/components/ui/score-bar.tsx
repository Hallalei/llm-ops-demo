"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/core/utils";

interface ScoreBarProps {
  label: string;
  value: number | null;
  className?: string;
}

/**
 * ScoreBar - Reusable score progress bar component
 * Displays a labeled progress bar for score visualization (0-1 range)
 */
export function ScoreBar({ label, value, className }: ScoreBarProps) {
  if (value === null || value === undefined) {
    return null;
  }

  // Convert 0-1 range to 0-100 percentage
  const percentage = Math.round(value * 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="w-20 shrink-0 text-muted-foreground text-xs">
        {label}
      </span>
      <Progress value={percentage} className="h-1.5 flex-1" />
      <span className="w-10 text-right text-muted-foreground text-xs">
        {percentage}%
      </span>
    </div>
  );
}

interface ScoreBarGroupProps {
  precision: string | null;
  relevance: string | null;
  languageMatch: string | null;
  fidelity: string | null;
  className?: string;
}

/**
 * ScoreBarGroup - Group of score bars for displaying all four scores
 */
export function ScoreBarGroup({
  precision,
  relevance,
  languageMatch,
  fidelity,
  className,
}: ScoreBarGroupProps) {
  // Parse string values to numbers
  const parseScore = (value: string | null): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const num = parseFloat(value);
    return Number.isNaN(num) ? null : num;
  };

  const precisionValue = parseScore(precision);
  const relevanceValue = parseScore(relevance);
  const languageMatchValue = parseScore(languageMatch);
  const fidelityValue = parseScore(fidelity);

  // If all scores are null, don't render anything
  const hasAnyScore =
    precisionValue !== null ||
    relevanceValue !== null ||
    languageMatchValue !== null ||
    fidelityValue !== null;

  if (!hasAnyScore) {
    return null;
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <ScoreBar label="precision" value={precisionValue} />
      <ScoreBar label="relevance" value={relevanceValue} />
      <ScoreBar label="lang match" value={languageMatchValue} />
      <ScoreBar label="fidelity" value={fidelityValue} />
    </div>
  );
}
