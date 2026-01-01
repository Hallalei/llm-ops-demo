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

interface IntentDistributionCardProps {
  data: Record<string, number>;
  onFilterClick?: FilterClickHandler;
}

const CATEGORY_LABELS: Record<string, string> = {
  product_inquiry: "产品咨询",
  technical_support: "技术支持",
  order_service: "订单服务",
  complaint: "投诉建议",
  other: "其他",
};

const chartConfig = {
  count: {
    label: "数量",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function IntentDistributionCard({
  data,
  onFilterClick,
}: IntentDistributionCardProps) {
  const chartData = Object.entries(data)
    .map(([category, count]) => ({
      category: CATEGORY_LABELS[category] || category,
      categoryKey: category,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const handleBarClick = (data: { categoryKey: string; category: string }) => {
    if (onFilterClick) {
      onFilterClick("category", data.categoryKey, `${data.category}的对话`);
    }
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">意图分类分布</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[150px] items-center justify-center">
          <p className="text-muted-foreground text-sm">暂无分类数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">意图分类分布</CardTitle>
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
              dataKey="category"
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
