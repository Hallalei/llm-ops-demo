"use client";

import { ArrowLeftRight, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/core/utils";
import type { Last24hTokenStats } from "@/lib/openrouter";
import type { FixedStatsWithTrend } from "../lib/queries";

interface StatsCardsProps {
  stats: FixedStatsWithTrend;
  tokenStats: Last24hTokenStats;
}

function formatNumber(num: number): string {
  return num.toLocaleString("zh-CN");
}

function formatChange(change: number): string {
  const prefix = change >= 0 ? "+" : "";
  return `${prefix}${change.toFixed(1)}%`;
}

function formatTokens(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return String(value);
}

export function StatsCards({ stats, tokenStats }: StatsCardsProps) {
  const [last24hView, setLast24hView] = useState<"traces" | "tokens">("traces");
  const cumulativeCards = [
    {
      key: "totalCount",
      title: "累计对话数",
      total: stats.totalCount.total,
      increment: stats.totalCount.periodIncrement,
      change: stats.totalCount.change,
    },
    {
      key: "uniqueUsers",
      title: "累计用户数",
      total: stats.uniqueUsers.total,
      increment: stats.uniqueUsers.periodIncrement,
      change: stats.uniqueUsers.change,
    },
    {
      key: "uniqueSessions",
      title: "累计会话数",
      total: stats.uniqueSessions.total,
      increment: stats.uniqueSessions.periodIncrement,
      change: stats.uniqueSessions.change,
    },
  ];

  const last24hPositive = stats.last24h.change >= 0;
  const Last24hTrendIcon = last24hPositive ? TrendingUp : TrendingDown;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cumulativeCards.map((card) => {
        const isPositive = card.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                {card.title}
              </CardTitle>
              <Badge
                className={cn(
                  "gap-1",
                  isPositive
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
                )}
              >
                <TrendIcon className="h-3 w-3" />
                {formatChange(card.change)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-3xl">
                {formatNumber(card.total)}
              </div>
              <p className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                <TrendIcon
                  className={cn(
                    "h-3 w-3",
                    isPositive ? "text-green-500" : "text-red-500",
                  )}
                />
                {stats.periodLabel} +{formatNumber(card.increment)} | 环比{" "}
                {formatChange(card.change)}
              </p>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className="flex cursor-pointer items-center gap-1 font-medium text-sm transition-colors hover:text-primary"
            onClick={() =>
              setLast24hView((v) => (v === "traces" ? "tokens" : "traces"))
            }
          >
            {last24hView === "traces" ? "近24h对话" : "近24h Token"}
            <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
          </CardTitle>
          <Badge
            className={cn(
              "gap-1",
              (
                last24hView === "traces"
                  ? last24hPositive
                  : tokenStats.change >= 0
              )
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
            )}
          >
            {last24hView === "traces" ? (
              <>
                <Last24hTrendIcon className="h-3 w-3" />
                {formatChange(stats.last24h.change)}
              </>
            ) : (
              <>
                {tokenStats.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatChange(tokenStats.change)}
              </>
            )}
          </Badge>
        </CardHeader>
        <CardContent>
          {last24hView === "traces" ? (
            <>
              <div className="font-bold text-3xl">
                {formatNumber(stats.last24h.current)}
              </div>
              <p className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                <Last24hTrendIcon
                  className={cn(
                    "h-3 w-3",
                    last24hPositive ? "text-green-500" : "text-red-500",
                  )}
                />
                较前24h {last24hPositive ? "增长" : "下降"}{" "}
                {Math.abs(stats.last24h.change).toFixed(1)}%
              </p>
            </>
          ) : (
            <>
              <div className="font-bold text-3xl">
                {formatTokens(tokenStats.current)}
              </div>
              <p className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                {tokenStats.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                较前24h {tokenStats.change >= 0 ? "增长" : "下降"}{" "}
                {Math.abs(tokenStats.change).toFixed(1)}%
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
