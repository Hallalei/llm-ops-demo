"use client";

import { FolderPlus } from "lucide-react";
import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/core/utils";

interface ChatBubbleProps {
  messageRole: "user" | "assistant";
  content: string;
  contentZh?: string | null;
  timestamp?: string | null;
  showTranslation: boolean;
  conversationId?: number;
  contextCount?: number;
  onAddToDataset?: () => void;
}

/**
 * ChatBubble - Chat message bubble component
 * - User messages: right-aligned, blue background
 * - AI messages: left-aligned, gray background with optional score bars
 */
export function ChatBubble({
  messageRole,
  content,
  contentZh,
  timestamp,
  showTranslation,
  conversationId,
  contextCount,
  onAddToDataset,
}: ChatBubbleProps) {
  const { canEdit } = useAuth();
  const isUser = messageRole === "user";
  const displayContent = showTranslation && contentZh ? contentZh : content;

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-blue-600 text-white dark:bg-blue-500"
            : "bg-muted text-foreground",
        )}
      >
        {/* Role label */}
        <div
          className={cn(
            "mb-1 font-medium text-xs",
            isUser ? "text-blue-100" : "text-muted-foreground",
          )}
        >
          {isUser ? "User" : "AI Assistant"}
        </div>

        {/* Message content */}
        <div className={cn("text-sm", isUser ? "text-white" : "")}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{displayContent}</p>
          ) : (
            <MarkdownRenderer
              content={displayContent || ""}
              className={cn(isUser && "[&_a]:text-blue-200")}
            />
          )}
        </div>

        {/* Translation notice */}
        {showTranslation && !contentZh && (
          <p
            className={cn(
              "mt-2 text-xs",
              isUser ? "text-blue-200" : "text-muted-foreground",
            )}
          >
            No Chinese translation available
          </p>
        )}

        {/* Footer: Timestamp and Actions */}
        <div
          className={cn(
            "mt-2 flex items-center justify-between gap-2",
            isUser ? "text-blue-200" : "text-muted-foreground",
          )}
        >
          {timestamp && <span className="text-xs">{timestamp}</span>}

          {/* Add to dataset button - only show for AI responses and users with edit permission */}
          {!isUser && conversationId && onAddToDataset && canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-background/50"
                  onClick={onAddToDataset}
                >
                  <FolderPlus className="mr-1 size-3" />
                  标记 Badcase
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>添加到数据集（含 {contextCount ?? 0} 条上下文）</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
