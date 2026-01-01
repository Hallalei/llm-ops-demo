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

interface LanguageDistributionCardProps {
  data: Record<string, number>;
  onFilterClick?: FilterClickHandler;
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const LANGUAGE_LABELS: Record<string, string> = {
  zh: "中文",
  en: "英语",
  uk: "乌克兰",
  ru: "俄语",
  pl: "波兰语",
  es: "西班牙",
  de: "德语",
  fr: "法语",
  pt: "葡萄牙",
  it: "意大利",
  ja: "日语",
  ko: "韩语",
  ar: "阿拉伯",
  nl: "荷兰语",
  tr: "土耳其",
  vi: "越南语",
  th: "泰语",
  id: "印尼语",
  cs: "捷克语",
  el: "希腊语",
  ro: "罗马尼亚",
  hu: "匈牙利",
  sv: "瑞典语",
  da: "丹麦语",
  fi: "芬兰语",
  no: "挪威语",
  he: "希伯来",
  hi: "印地语",
  bn: "孟加拉",
  ms: "马来语",
  other: "其他",
};

const chartConfig = {
  zh: { label: "中文", color: "var(--chart-1)" },
  en: { label: "英文", color: "var(--chart-2)" },
  other: { label: "其他", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function LanguageDistributionCard({
  data,
  onFilterClick,
}: LanguageDistributionCardProps) {
  const total = Object.values(data).reduce((sum, v) => sum + v, 0);
  const sortedData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Top 5（不在图表中显示"其他"）
  const top5 = sortedData.slice(0, 5);
  const otherLanguages = sortedData.slice(5);
  const otherValue = otherLanguages.reduce((sum, item) => sum + item.value, 0);
  const chartData = top5;

  if (chartData.length === 0 || total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">语种分布</CardTitle>
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
        <CardTitle className="text-base">语种分布</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <ChartContainer
          config={chartConfig}
          className="h-[120px] w-[120px] shrink-0"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="font-mono">
                      {LANGUAGE_LABELS[name as string] || name}:{" "}
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
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
          {chartData.map((item, index) => (
            <button
              type="button"
              key={item.name}
              className={`flex items-center gap-1.5 ${onFilterClick ? "-mx-1 cursor-pointer rounded-md px-1 transition-colors hover:bg-muted" : ""}`}
              onClick={() =>
                onFilterClick?.(
                  "language",
                  item.name,
                  `${LANGUAGE_LABELS[item.name] || item.name}对话`,
                )
              }
              disabled={!onFilterClick}
            >
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate text-muted-foreground">
                {LANGUAGE_LABELS[item.name] || item.name}
              </span>
              <span className="ml-auto shrink-0 font-medium">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </button>
          ))}
          {otherValue > 0 && (
            <p className="mt-1 text-muted-foreground/70 text-xs">
              其他 {otherLanguages.length} 种语言占{" "}
              {((otherValue / total) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
