"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { FilterClickHandler } from "./types";

interface UserFeedbackCardProps {
  feedback: { like: number; dislike: number };
  onFilterClick?: FilterClickHandler;
}

const chartConfig = {
  like: { label: "点赞", color: "#22c55e" },
  dislike: { label: "点踩", color: "#ef4444" },
} satisfies ChartConfig;

export function UserFeedbackCard({
  feedback,
  onFilterClick,
}: UserFeedbackCardProps) {
  const total = feedback.like + feedback.dislike;
  const chartData = [
    { name: "like", value: feedback.like, fill: "#22c55e" },
    { name: "dislike", value: feedback.dislike, fill: "#ef4444" },
  ].filter((item) => item.value > 0);

  const clickableClass = onFilterClick
    ? "cursor-pointer rounded-md px-2 py-1 -mx-2 transition-colors hover:bg-muted"
    : "";

  const hasChartData = chartData.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">用户反馈</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        {hasChartData ? (
          <ChartContainer
            config={chartConfig}
            className="h-[100px] w-[100px] shrink-0"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span className="font-mono">
                        {name === "like" ? "点赞" : "点踩"}:{" "}
                        {Number(value).toLocaleString("zh-CN")}
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
                innerRadius={25}
                outerRadius={42}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-full border-4 border-muted">
            <span className="text-muted-foreground text-xs">暂无</span>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className={`flex items-center gap-2 text-sm ${clickableClass}`}
            onClick={() => onFilterClick?.("feedback", "like", "点赞的对话")}
            disabled={!onFilterClick}
          >
            <ThumbsUp className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">点赞</span>
            <span className="ml-auto font-semibold">
              {feedback.like.toLocaleString("zh-CN")}
            </span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 text-sm ${clickableClass}`}
            onClick={() => onFilterClick?.("feedback", "dislike", "点踩的对话")}
            disabled={!onFilterClick}
          >
            <ThumbsDown className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">点踩</span>
            <span className="ml-auto font-semibold">
              {feedback.dislike.toLocaleString("zh-CN")}
            </span>
          </button>
          {total > 0 && (
            <div className="border-t pt-2 text-muted-foreground text-xs">
              共 {total.toLocaleString("zh-CN")} 条反馈
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
