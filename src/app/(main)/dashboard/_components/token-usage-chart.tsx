"use client";

import { Coins, TrendingUp } from "lucide-react";
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
import type { TokenUsageData } from "@/lib/openrouter";

interface TokenUsageChartProps {
  data: TokenUsageData[];
  days: number;
}

const chartConfig = {
  tokens: {
    label: "Tokens",
    color: "var(--chart-1)",
  },
  requests: {
    label: "请求数",
    color: "var(--chart-2)",
  },
  spend: {
    label: "费用 ($)",
    color: "var(--chart-3)",
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

export function TokenUsageChart({ data, days }: TokenUsageChartProps) {
  const totalTokens = data.reduce((sum, d) => sum + d.tokens, 0);
  const totalRequests = data.reduce((sum, d) => sum + d.requests, 0);
  const totalSpend = data.reduce((sum, d) => sum + d.spend, 0);

  const hasData = totalTokens > 0 || totalRequests > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Token 消耗趋势
        </CardTitle>
        <CardDescription>近 {days} 天 OpenRouter API 使用情况</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={data}
              margin={{
                top: 20,
                left: 12,
                right: 12,
              }}
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
                      if (name === "requests") {
                        return [value, "请求数"];
                      }
                      if (name === "spend") {
                        return [`$${(value as number).toFixed(4)}`, "费用"];
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
                dot={{
                  fill: "var(--color-tokens)",
                }}
                activeDot={{
                  r: 6,
                }}
              >
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={10}
                  formatter={formatTokens}
                />
              </Line>
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            暂无 Token 消耗数据
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          累计消耗 {formatTokens(totalTokens)} tokens
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          共 {totalRequests.toLocaleString()} 次请求，费用 $
          {totalSpend.toFixed(2)}
        </div>
      </CardFooter>
    </Card>
  );
}
