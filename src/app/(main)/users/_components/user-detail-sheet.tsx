"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  UserConversation,
  UserSession,
  UserSummary,
} from "../lib/queries";

interface UserDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserSummary | null;
  conversations: UserConversation[];
  sessions: UserSession[];
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function UserDetailSheet({
  open,
  onOpenChange,
  user,
  conversations,
  sessions,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: UserDetailSheetProps) {
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      }
      if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasPrevious, hasNext, onPrevious, onNext]);

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-[600px] flex-col p-0 sm:max-w-[600px]">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>用户详情</SheetTitle>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>上一个 (←)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={onNext}
                    disabled={!hasNext}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>下一个 (→)</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <SheetDescription className="font-mono text-xs">
            {user.externalId}
          </SheetDescription>
        </SheetHeader>

        {/* User stats */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">总对话数</p>
                <p className="font-medium">{user.totalConversations}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">总会话数</p>
                <p className="font-medium">{user.totalSessions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">首次活跃</p>
                <p className="text-xs">{user.firstSeenAt || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">最后活跃</p>
                <p className="text-xs">{user.lastSeenAt || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-4">
            {/* Recent Sessions */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-sm">最近会话</h3>
                <Link
                  href={`/sessions?userId=${encodeURIComponent(user.externalId)}`}
                  className="flex items-center gap-1 text-blue-600 text-xs hover:underline dark:text-blue-400"
                >
                  查看全部
                  <ExternalLink className="size-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {sessions.slice(0, 5).map((session) => (
                  <Link
                    key={session.sessionId}
                    href={`/sessions/${encodeURIComponent(session.sessionId)}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="max-w-[200px] truncate font-mono text-xs">
                        {session.sessionId?.slice(0, 20)}...
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {session.messageCount} 条消息
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {session.lastMessageTime || "-"}
                    </p>
                  </Link>
                ))}
                {sessions.length === 0 && (
                  <p className="py-4 text-center text-muted-foreground text-sm">
                    暂无会话记录
                  </p>
                )}
              </div>
            </div>

            {/* Recent Conversations */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-sm">最近对话</h3>
                <Link
                  href={`/traces?userId=${encodeURIComponent(user.externalId)}`}
                  className="flex items-center gap-1 text-blue-600 text-xs hover:underline dark:text-blue-400"
                >
                  查看全部
                  <ExternalLink className="size-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {conversations.slice(0, 5).map((conv) => (
                  <div key={conv.id} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">
                        {conv.createdTime || "-"}
                      </span>
                      {conv.env && (
                        <Badge
                          variant={
                            conv.env === "prod" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {conv.env === "prod" ? "生产" : "开发"}
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm">{conv.query || "-"}</p>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <p className="py-4 text-center text-muted-foreground text-sm">
                    暂无对话记录
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
