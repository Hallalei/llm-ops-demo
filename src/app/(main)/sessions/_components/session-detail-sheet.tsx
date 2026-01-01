"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Expand,
  MessageSquare,
  Minimize2,
  User,
} from "lucide-react";
import * as React from "react";
import { AddToDatasetDialog } from "@/components/datasets/add-to-dataset-dialog";
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
import { cn } from "@/lib/core/utils";
import type { SessionConversation, SessionSummary } from "../lib/queries";
import { ChatBubble } from "./chat-bubble";

interface SessionDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionSummary | null;
  conversations: SessionConversation[];
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

type Language = "zh" | "original";

interface DatasetDialogState {
  open: boolean;
  conversationId: number;
  contextCount: number;
  query: string;
}

export function SessionDetailSheet({
  open,
  onOpenChange,
  session,
  conversations,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: SessionDetailSheetProps) {
  const [language, setLanguage] = React.useState<Language>("zh");
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const showTranslation = language === "zh";

  const [dialogState, setDialogState] = React.useState<DatasetDialogState>({
    open: false,
    conversationId: 0,
    contextCount: 0,
    query: "",
  });

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
      if (e.key === "Escape" && isFullScreen) {
        e.preventDefault();
        setIsFullScreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasPrevious, hasNext, onPrevious, onNext, isFullScreen]);

  const handleAddToDataset = (conv: SessionConversation, index: number) => {
    setDialogState({
      open: true,
      conversationId: conv.id,
      contextCount: index,
      query: conv.query || "",
    });
  };

  if (!session) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          fullScreen={isFullScreen}
          className={cn(
            "flex flex-col p-0",
            !isFullScreen && "w-[75vw] min-w-[600px] max-w-[1000px]",
          )}
        >
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                会话详情
                <Badge
                  variant={session.env === "prod" ? "default" : "secondary"}
                >
                  {session.env === "prod" ? "生产" : "开发"}
                </Badge>
              </SheetTitle>
              <div className="flex items-center gap-2">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setIsFullScreen(!isFullScreen)}
                    >
                      {isFullScreen ? (
                        <Minimize2 className="size-4" />
                      ) : (
                        <Expand className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFullScreen ? "收起 (Esc)" : "全屏查看"}
                  </TooltipContent>
                </Tooltip>
                <LanguageToggle language={language} onChange={setLanguage} />
              </div>
            </div>
            <SheetDescription className="font-mono text-xs">
              {session.sessionId}
            </SheetDescription>
          </SheetHeader>

          {/* Session info */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">用户 ID</p>
                  <p className="font-mono text-sm">{session.userId || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">消息数量</p>
                  <p className="font-medium">{session.messageCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">开始时间</p>
                  <p className="text-xs">{session.firstMessageTime || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">最后活跃</p>
                  <p className="text-xs">{session.lastMessageTime || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Conversation content */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4">
              {conversations.map((conv, index) => (
                <React.Fragment key={conv.id}>
                  {conv.query && (
                    <ChatBubble
                      messageRole="user"
                      content={conv.query}
                      contentZh={conv.queryZh}
                      timestamp={conv.createdTime}
                      showTranslation={showTranslation}
                    />
                  )}
                  {conv.response && (
                    <ChatBubble
                      messageRole="assistant"
                      content={conv.response}
                      contentZh={conv.responseZh}
                      showTranslation={showTranslation}
                      conversationId={conv.id}
                      contextCount={index}
                      onAddToDataset={() => handleAddToDataset(conv, index)}
                    />
                  )}
                </React.Fragment>
              ))}
              {conversations.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  暂无对话记录
                </p>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AddToDatasetDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
        source="session"
        conversationId={dialogState.conversationId}
        sessionId={session.sessionId}
        preview={{
          query: dialogState.query,
          contextCount: dialogState.contextCount,
        }}
      />
    </>
  );
}

function LanguageToggle({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="inline-flex h-8 items-center rounded-md border bg-muted p-0.5 text-muted-foreground">
      <button
        onClick={() => onChange("zh")}
        className={cn(
          "inline-flex items-center justify-center rounded-sm px-3 py-1.5 font-medium text-sm transition-colors",
          language === "zh"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50",
        )}
      >
        中文
      </button>
      <button
        onClick={() => onChange("original")}
        className={cn(
          "inline-flex items-center justify-center rounded-sm px-3 py-1.5 font-medium text-sm transition-colors",
          language === "original"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50",
        )}
      >
        原文
      </button>
    </div>
  );
}
