"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyTrendItem } from "../lib/queries";

interface DailyTrendChartProps {
  data: DailyTrendItem[];
  days: number;
}

const chartConfig = {
  prodCount: {
    label: "生产环境",
    color: "var(--chart-1)",
  },
  devCount: {
    label: "开发环境",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

/**
 * 格式化日期显示
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function DailyTrendChart({ data, days }: DailyTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>每日对话趋势</CardTitle>
        <CardDescription>最近 {days} 天的对话数量变化</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDate}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="prodCount"
              type="monotone"
              fill="var(--color-prodCount)"
              fillOpacity={0.4}
              stroke="var(--color-prodCount)"
              stackId="a"
            />
            <Area
              dataKey="devCount"
              type="monotone"
              fill="var(--color-devCount)"
              fillOpacity={0.4}
              stroke="var(--color-devCount)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
