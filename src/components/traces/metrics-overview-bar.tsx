"use client";

import {
  Clock,
  Globe,
  MessageSquare,
  Tag,
  Target,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/core/utils";

interface MetricsOverviewBarProps {
  detectedLanguage: string | null;
  latency: string | null;
  category: string | null;
  precision: string | null;
  relevance: string | null;
  languageMatch: string | null;
  fidelity: string | null;
  scores: Record<string, unknown> | null;
  tags: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  product_inquiry: "产品咨询",
  technical_support: "技术支持",
  order_service: "订单服务",
  complaint: "投诉建议",
  other: "其他",
};

const LANGUAGE_LABELS: Record<string, string> = {
  ar: "阿拉伯语",
  bg: "保加利亚语",
  de: "德语",
  en: "英语",
  es: "西班牙语",
  fr: "法语",
  hi: "印地语",
  hu: "匈牙利语",
  id: "印尼语",
  it: "意大利语",
  ja: "日本语",
  nl: "荷兰语",
  tl: "菲律宾语",
  pl: "波兰语",
  pt: "葡萄牙语",
  ro: "罗马尼亚语",
  ru: "俄语",
  th: "泰语",
  tr: "土耳其语",
  uk: "乌克兰语",
  uz: "乌兹别克语",
  vi: "越南语",
  "zh-TW": "繁体中文",
  "zh-CN": "简体中文",
  other: "其他",
};

function getLanguageName(code: string): string {
  return LANGUAGE_LABELS[code] || "其他";
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

function parseScore(value: string | null): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

function extractUserFeedback(scores: Record<string, unknown> | null): {
  type: "up" | "down" | null;
  comment: string | null;
} {
  if (!scores) return { type: null, comment: null };

  let type: "up" | "down" | null = null;
  let comment: string | null = null;

  if ("user_feedback" in scores) {
    const feedback = scores.user_feedback;
    if (typeof feedback === "object" && feedback !== null) {
      const fb = feedback as Record<string, unknown>;
      if (fb.value === 1 || fb.value === "positive" || fb.thumbs_up === true) {
        type = "up";
      } else if (
        fb.value === -1 ||
        fb.value === "negative" ||
        fb.thumbs_down === true
      ) {
        type = "down";
      }
      if (typeof fb.comment === "string") {
        comment = fb.comment;
      }
    } else if (typeof feedback === "number") {
      type = feedback > 0 ? "up" : feedback < 0 ? "down" : null;
    }
  }

  if ("thumbs_up" in scores && scores.thumbs_up) {
    type = "up";
  }
  if ("thumbs_down" in scores && scores.thumbs_down) {
    type = "down";
  }

  if (
    "feedback_comment" in scores &&
    typeof scores.feedback_comment === "string"
  ) {
    comment = scores.feedback_comment;
  }

  return { type, comment };
}

function MiniScore({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground text-xs">{label}-</span>;
  }

  const percentage = Math.round(value * 100);
  const isLow = percentage < 60;

  return (
    <span
      className={cn(
        "text-xs",
        isLow ? "font-medium text-red-500" : "text-muted-foreground",
      )}
    >
      {label}
      {percentage}%
    </span>
  );
}

export function MetricsOverviewBar({
  detectedLanguage,
  latency,
  category,
  precision,
  relevance,
  languageMatch,
  fidelity,
  scores,
  tags,
}: MetricsOverviewBarProps) {
  const precisionValue = parseScore(precision);
  const relevanceValue = parseScore(relevance);
  const languageMatchValue = parseScore(languageMatch);
  const fidelityValue = parseScore(fidelity);

  const { type: feedbackType, comment: feedbackComment } =
    extractUserFeedback(scores);

  const tagList = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 px-4 py-3">
      {/* 语种 */}
      <div className="flex items-center gap-2">
        <Globe className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground text-xs">语种</span>
        <Badge variant="secondary" className="text-xs">
          {detectedLanguage ? getLanguageName(detectedLanguage) : "-"}
        </Badge>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 延迟 */}
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground text-xs">延迟</span>
        <span className="font-medium text-sm">
          {latency ? `${latency}s` : "-"}
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 意图分类 */}
      <div className="flex items-center gap-2">
        <Target className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground text-xs">意图</span>
        {category ? (
          <Badge variant="outline" className="text-xs">
            {getCategoryLabel(category)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 质量评分 */}
      <div className="flex items-center gap-2">
        <MiniScore label="精准" value={precisionValue} />
        <MiniScore label="相关" value={relevanceValue} />
        <MiniScore label="语言" value={languageMatchValue} />
        <MiniScore label="忠诚" value={fidelityValue} />
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 用户反馈 */}
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground text-xs">反馈</span>
        {feedbackType !== null ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-1 rounded px-1.5 py-0.5",
                  feedbackType === "up"
                    ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                )}
              >
                {feedbackType === "up" ? (
                  <ThumbsUp className="size-3" />
                ) : (
                  <ThumbsDown className="size-3" />
                )}
                {feedbackComment && (
                  <span className="max-w-[60px] truncate text-xs">
                    {feedbackComment}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            {feedbackComment && (
              <TooltipContent className="max-w-[300px]">
                {feedbackComment}
              </TooltipContent>
            )}
          </Tooltip>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 标签 */}
      <div className="flex items-center gap-2">
        <Tag className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground text-xs">标签</span>
        {tagList.length > 0 ? (
          <div className="flex items-center gap-1">
            {tagList.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tagList.length > 2 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    +{tagList.length - 2}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{tagList.slice(2).join(", ")}</TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </div>
    </div>
  );
}
