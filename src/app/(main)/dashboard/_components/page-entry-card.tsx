"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { FilterClickHandler } from "./types";

interface PageEntryCardProps {
  data: Record<string, number>;
  onFilterClick?: FilterClickHandler;
}

const PAGE_LABELS: Record<string, string> = {
  stationDetailPage: "电站详情",
  stationListPage: "电站列表",
  supportCenterPage: "帮助中心",
  copilotPage: "Copilot",
  LivePricePage: "实时电价",
  plantListSearchPage: "电站搜索",
  PlantControlModeSettingPage: "控制模式",
};

const chartConfig = {
  count: { label: "对话数", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PageEntryCard({ data, onFilterClick }: PageEntryCardProps) {
  const chartData = Object.entries(data)
    .map(([page, count]) => ({
      page: PAGE_LABELS[page] || page,
      pageKey: page,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const handleBarClick = (data: { pageKey: string; page: string }) => {
    if (onFilterClick) {
      onFilterClick("pageEntry", data.pageKey, `${data.page}的对话`);
    }
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">页面入口分布</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[150px] items-center justify-center">
          <p className="text-muted-foreground text-sm">暂无数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">页面入口分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[150px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 16 }}
          >
            <XAxis type="number" tickLine={false} axisLine={false} hide />
            <YAxis
              type="category"
              dataKey="page"
              tickLine={false}
              axisLine={false}
              width={70}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="font-medium font-mono">
                      {Number(value).toLocaleString("zh-CN")} 条对话
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 4, 4, 0]}
              className={onFilterClick ? "cursor-pointer" : ""}
              onClick={(data) => handleBarClick(data)}
              label={{
                position: "right",
                fontSize: 10,
                fill: "var(--foreground)",
                formatter: (v: number) => v.toLocaleString("zh-CN"),
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
