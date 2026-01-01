"use client";

import { useState } from "react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TokenUsageData } from "@/lib/openrouter";
import type { DailyTrendItem } from "../lib/queries";

interface UnifiedTrendChartProps {
  tokenData: TokenUsageData[];
  traceData: DailyTrendItem[];
  days: number;
}

const tokenChartConfig = {
  tokens: {
    label: "Tokens",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const traceChartConfig = {
  total: {
    label: "对话数",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatTokens(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return String(value);
}

function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return String(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

function getDateLabel(days: number): string {
  if (days === 0) return "全部时间";
  if (days === 1) return "近 24 小时";
  return `近 ${days} 天`;
}

export function UnifiedTrendChart({
  tokenData,
  traceData,
  days,
}: UnifiedTrendChartProps) {
  const [activeTab, setActiveTab] = useState<"tokens" | "traces">("tokens");

  const totalTokens = tokenData.reduce((sum, d) => sum + d.tokens, 0);
  const totalRequests = tokenData.reduce((sum, d) => sum + d.requests, 0);
  const totalSpend = tokenData.reduce((sum, d) => sum + d.spend, 0);

  const totalTraces = traceData.reduce((sum, d) => sum + d.total, 0);

  const hasTokenData = totalTokens > 0 || totalRequests > 0;
  const hasTraceData = traceData.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>趋势分析</CardTitle>
          <CardDescription>{getDateLabel(days)}数据变化</CardDescription>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "tokens" | "traces")}
        >
          <TabsList>
            <TabsTrigger value="traces">对话数</TabsTrigger>
            <TabsTrigger value="tokens">Token 消耗</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {activeTab === "tokens" ? (
          hasTokenData ? (
            <ChartContainer
              config={tokenChartConfig}
              className="h-[280px] w-full"
            >
              <LineChart
                accessibilityLayer
                data={tokenData}
                margin={{ top: 20, left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatTokens}
                  width={50}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value, name) => {
                        if (name === "tokens") {
                          return [
                            `${formatTokens(value as number)} tokens`,
                            "Token消耗",
                          ];
                        }
                        return [value, name];
                      }}
                    />
                  }
                />
                <Line
                  dataKey="tokens"
                  type="natural"
                  stroke="var(--color-tokens)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-tokens)" }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList
                    dataKey="tokens"
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={11}
                    formatter={formatTokens}
                  />
                </Line>
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground">
              暂无 Token 消耗数据
            </div>
          )
        ) : hasTraceData ? (
          <ChartContainer
            config={traceChartConfig}
            className="h-[280px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={traceData}
              margin={{ top: 20, left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatDate}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCount}
                width={50}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} 条`,
                      "对话数",
                    ]}
                  />
                }
              />
              <Line
                dataKey="total"
                type="natural"
                stroke="var(--color-total)"
                strokeWidth={2}
                dot={{ fill: "var(--color-total)" }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  dataKey="total"
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={11}
                  formatter={formatCount}
                />
              </Line>
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center text-muted-foreground">
            暂无对话数据
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {activeTab === "tokens" ? (
          <>
            <div className="font-medium leading-none">
              累计消耗 {formatTokens(totalTokens)} tokens
            </div>
            <div className="text-muted-foreground leading-none">
              共 {totalRequests.toLocaleString()} 次请求，费用 $
              {totalSpend.toFixed(2)}
            </div>
          </>
        ) : (
          <div className="font-medium leading-none">
            共 {totalTraces.toLocaleString()} 条对话
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
