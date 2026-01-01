"use client";

import { AlertTriangle, Filter, ThumbsDown } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/core/utils";

const qualityFilterOptions = [
  { value: "all", label: "全部", description: "显示所有对话" },
  { value: "low_any", label: "低分回复", description: "任一指标 < 60%" },
  { value: "low_fidelity", label: "低忠诚度", description: "忠诚度 < 60%" },
  { value: "low_relevance", label: "低相关性", description: "相关性 < 60%" },
  { value: "low_precision", label: "低精准度", description: "精准度 < 60%" },
  { value: "thumbs_down", label: "用户点踩", description: "用户反馈为差评" },
] as const;

const reviewFilterOptions = [
  { value: "all", label: "全部", description: "显示所有对话" },
  { value: "unreviewed", label: "未读", description: "尚未查看的对话" },
  { value: "reviewed", label: "已读", description: "已查看过的对话" },
  { value: "flagged", label: "已标记", description: "标记为问题的对话" },
] as const;

export function QualityQuickFilter() {
  const [qualityFilter, setQualityFilter] = useQueryState(
    "qualityFilter",
    parseAsStringEnum([
      "all",
      "low_fidelity",
      "low_relevance",
      "low_precision",
      "low_any",
      "thumbs_down",
    ]).withDefault("all"),
  );

  const [reviewStatus, setReviewStatus] = useQueryState(
    "reviewStatus",
    parseAsStringEnum([
      "all",
      "unreviewed",
      "reviewed",
      "flagged",
      "skipped",
    ]).withDefault("all"),
  );

  const activeQualityOption = qualityFilterOptions.find(
    (opt) => opt.value === qualityFilter,
  );
  const activeReviewOption = reviewFilterOptions.find(
    (opt) => opt.value === reviewStatus,
  );

  const hasActiveFilter = qualityFilter !== "all" || reviewStatus !== "all";

  return (
    <div className="flex items-center gap-2">
      {/* 质量筛选 */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant={qualityFilter !== "all" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 gap-1.5",
                  qualityFilter !== "all" &&
                    "bg-orange-600 hover:bg-orange-700",
                )}
              >
                <AlertTriangle className="size-4" />
                <span className="hidden sm:inline">
                  {qualityFilter === "all"
                    ? "质量筛选"
                    : activeQualityOption?.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>快速筛选低质量回复</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>质量筛选</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {qualityFilterOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={qualityFilter === option.value}
              onCheckedChange={() => setQualityFilter(option.value)}
            >
              <div className="flex flex-col gap-0.5">
                <span>{option.label}</span>
                <span className="text-muted-foreground text-xs">
                  {option.description}
                </span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 审核状态筛选 */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant={reviewStatus !== "all" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 gap-1.5",
                  reviewStatus !== "all" && "bg-blue-600 hover:bg-blue-700",
                )}
              >
                <Filter className="size-4" />
                <span className="hidden sm:inline">
                  {reviewStatus === "all"
                    ? "阅读状态"
                    : activeReviewOption?.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>按阅读状态筛选</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>阅读状态</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {reviewFilterOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={reviewStatus === option.value}
              onCheckedChange={() => setReviewStatus(option.value)}
            >
              <div className="flex flex-col gap-0.5">
                <span>{option.label}</span>
                <span className="text-muted-foreground text-xs">
                  {option.description}
                </span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 活跃筛选标签 */}
      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground"
          onClick={() => {
            setQualityFilter("all");
            setReviewStatus("all");
          }}
        >
          清除筛选
        </Button>
      )}
    </div>
  );
}
