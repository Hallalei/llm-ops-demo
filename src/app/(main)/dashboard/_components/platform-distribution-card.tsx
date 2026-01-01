"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { FilterClickHandler } from "./types";

interface PlatformDistributionCardProps {
  data: Record<string, number>;
  onFilterClick?: FilterClickHandler;
}

const chartConfig = {
  App: { label: "App 端", color: "var(--chart-1)" },
  Web: { label: "Web 端", color: "var(--chart-2)" },
  Other: { label: "其他", color: "var(--chart-3)" },
} satisfies ChartConfig;

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

export function PlatformDistributionCard({
  data,
  onFilterClick,
}: PlatformDistributionCardProps) {
  const total = Object.values(data).reduce((sum, v) => sum + v, 0);
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  if (chartData.length === 0 || total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">平台分布</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[140px] items-center justify-center">
          <p className="text-muted-foreground text-sm">暂无数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">平台分布</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <ChartContainer config={chartConfig} className="h-[120px] w-[120px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="font-mono">
                      {chartConfig[name as keyof typeof chartConfig]?.label}:{" "}
                      {Number(value).toLocaleString("zh-CN")} (
                      {((Number(value) / total) * 100).toFixed(1)}%)
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-col gap-2 text-sm">
          {chartData.map((item, index) => (
            <button
              type="button"
              key={item.name}
              className={`flex items-center gap-2 ${onFilterClick ? "-mx-1 cursor-pointer rounded-md px-1 transition-colors hover:bg-muted" : ""}`}
              onClick={() =>
                onFilterClick?.(
                  "platform",
                  item.name,
                  `${chartConfig[item.name as keyof typeof chartConfig]?.label || item.name}的对话`,
                )
              }
              disabled={!onFilterClick}
            >
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground">
                {chartConfig[item.name as keyof typeof chartConfig]?.label ||
                  item.name}
              </span>
              <span className="font-medium">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
