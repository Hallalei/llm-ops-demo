"use client";

import {
  Clock,
  MessageSquareWarning,
  Target,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/core/utils";

interface FeedbackPanelProps {
  latency: string | null;
  category: string | null;
  precision: string | null;
  relevance: string | null;
  languageMatch: string | null;
  fidelity: string | null;
  scores: Record<string, unknown> | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  product_inquiry: "产品咨询",
  technical_support: "技术支持",
  order_service: "订单服务",
  complaint: "投诉建议",
  other: "其他",
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

function parseScore(value: string | null): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

interface ScoreItemProps {
  label: string;
  value: number | null;
}

function ScoreItem({ label, value }: ScoreItemProps) {
  if (value === null) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="text-muted-foreground text-sm">-</span>
      </div>
    );
  }

  const percentage = Math.round(value * 100);
  const getColorClass = (pct: number) => {
    if (pct >= 80) return "bg-green-500";
    if (pct >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="font-medium text-sm">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", getColorClass(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
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

function extractOtherScores(
  scores: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!scores) return {};

  const excludeKeys = [
    "user_feedback",
    "thumbs_up",
    "thumbs_down",
    "feedback_comment",
  ];

  const other: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(scores)) {
    if (!excludeKeys.includes(key)) {
      other[key] = value;
    }
  }

  return other;
}

export function FeedbackPanel({
  latency,
  category,
  precision,
  relevance,
  languageMatch,
  fidelity,
  scores,
}: FeedbackPanelProps) {
  const precisionValue = parseScore(precision);
  const relevanceValue = parseScore(relevance);
  const languageMatchValue = parseScore(languageMatch);
  const fidelityValue = parseScore(fidelity);

  const hasAnyScore =
    precisionValue !== null ||
    relevanceValue !== null ||
    languageMatchValue !== null ||
    fidelityValue !== null;

  const { type: feedbackType, comment: feedbackComment } =
    extractUserFeedback(scores);
  const otherScores = extractOtherScores(scores);

  return (
    <div className="space-y-4">
      {/* 性能指标 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="size-4" />
            性能指标
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">延迟</span>
              <p className="font-medium text-lg">
                {latency ? `${latency}s` : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">意图分类</span>
              <div>
                {category ? (
                  <Badge variant="outline">{getCategoryLabel(category)}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 质量评分 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="size-4" />
            质量评分
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasAnyScore ? (
            <div className="space-y-4">
              <ScoreItem label="精准度" value={precisionValue} />
              <ScoreItem label="相关性" value={relevanceValue} />
              <ScoreItem label="语言匹配率" value={languageMatchValue} />
              <ScoreItem label="忠诚度" value={fidelityValue} />
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              暂无评分数据
            </p>
          )}
        </CardContent>
      </Card>

      {/* 用户反馈 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquareWarning className="size-4" />
            用户反馈
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedbackType !== null ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-4 py-2",
                    feedbackType === "up"
                      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  <ThumbsUp className="size-4" />
                  <span className="text-sm">赞</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-4 py-2",
                    feedbackType === "down"
                      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  <ThumbsDown className="size-4" />
                  <span className="text-sm">踩</span>
                </div>
              </div>
              {feedbackComment && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">
                    反馈评论
                  </span>
                  <p className="rounded-md bg-muted p-3 text-sm">
                    {feedbackComment}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              暂无用户反馈
            </p>
          )}
        </CardContent>
      </Card>

      {/* 其他评分 */}
      {Object.keys(otherScores).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">其他评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(otherScores).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{key}</span>
                  <span className="font-mono text-sm">
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
