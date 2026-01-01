"use client";

import { AlertTriangle, BookX, CircleOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FilterClickHandler } from "./types";

interface IssuesStatsCardProps {
  issues: { noKnowledge: number; emptyReply: number };
  onFilterClick?: FilterClickHandler;
}

export function IssuesStatsCard({
  issues,
  onFilterClick,
}: IssuesStatsCardProps) {
  const total = issues.noKnowledge + issues.emptyReply;
  const clickableClass = onFilterClick
    ? "cursor-pointer rounded-md px-3 py-2 -mx-3 transition-colors hover:bg-muted"
    : "";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          异常统计
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <button
          type="button"
          className={`flex items-center gap-3 ${clickableClass}`}
          onClick={() =>
            onFilterClick?.("noKnowledge", "all", "缺少知识的对话")
          }
          disabled={!onFilterClick}
        >
          <BookX className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">缺少知识</span>
            <span className="text-muted-foreground text-xs">
              未命中知识库的对话
            </span>
          </div>
          <span className="ml-auto font-semibold text-lg">
            {issues.noKnowledge.toLocaleString("zh-CN")}
          </span>
        </button>
        <button
          type="button"
          className={`flex items-center gap-3 ${clickableClass}`}
          onClick={() => onFilterClick?.("emptyReply", "all", "回复为空的对话")}
          disabled={!onFilterClick}
        >
          <CircleOff className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">回复为空</span>
            <span className="text-muted-foreground text-xs">
              AI 未生成回复的对话
            </span>
          </div>
          <span className="ml-auto font-semibold text-lg">
            {issues.emptyReply.toLocaleString("zh-CN")}
          </span>
        </button>
        {total > 0 && (
          <div className="border-t pt-2 text-muted-foreground text-xs">
            共 {total.toLocaleString("zh-CN")} 条异常对话
          </div>
        )}
      </CardContent>
    </Card>
  );
}
