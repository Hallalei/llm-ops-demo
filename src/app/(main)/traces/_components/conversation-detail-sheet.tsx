"use client";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Expand,
  FolderPlus,
  Minimize2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { AddToDatasetDialog } from "@/components/datasets/add-to-dataset-dialog";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Conversation } from "@/db/schema";
import { cn } from "@/lib/core/utils";
import { FeedbackPanel } from "./feedback-panel";
import { MetadataRenderer } from "./metadata-renderer";

interface ConversationDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation:
    | (Conversation & {
        queryZh?: string | null;
        responseZh?: string | null;
        category?: string | null;
        confidence?: string | null;
      })
    | null;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

type ViewMode = "rendered" | "raw";
type Language = "zh" | "original";

export function ConversationDetailSheet({
  open,
  onOpenChange,
  conversation,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: ConversationDetailSheetProps) {
  const [queryViewMode, setQueryViewMode] =
    React.useState<ViewMode>("rendered");
  const [responseViewMode, setResponseViewMode] =
    React.useState<ViewMode>("rendered");
  const [language, setLanguage] = React.useState<Language>("zh");
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

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

  if (!conversation) return null;

  const displayQuery =
    language === "zh" && conversation.queryZh
      ? conversation.queryZh
      : conversation.query;
  const displayResponse =
    language === "zh" && conversation.responseZh
      ? conversation.responseZh
      : conversation.response;
  const hasQueryTranslation = !!conversation.queryZh;
  const hasResponseTranslation = !!conversation.responseZh;

  const traceId = conversation.traceId;
  const sessionId = conversation.sessionId;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已复制${label}`);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          fullScreen={isFullScreen}
          className={cn(
            "flex flex-col p-0",
            !isFullScreen && "w-[50vw] min-w-[600px] max-w-[900px]",
          )}
        >
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                对话详情
                <Badge
                  variant={
                    conversation.env === "prod" ? "default" : "secondary"
                  }
                >
                  {conversation.env === "prod" ? "生产" : "开发"}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowAddDialog(true)}
                    >
                      <FolderPlus className="mr-1.5 size-4" />
                      添加到数据集
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>添加到数据集</TooltipContent>
                </Tooltip>
                <LanguageToggle language={language} onChange={setLanguage} />
              </div>
            </div>
            <SheetDescription>
              ID: {conversation.id} | 时间: {conversation.createdTime}
            </SheetDescription>
          </SheetHeader>

          {/* 基本信息卡片 */}
          <div className="px-6 pb-4">
            <Card>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">用户ID</span>
                  <p className="font-mono text-sm">
                    {conversation.userId || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">追踪ID</span>
                  <div className="group flex items-center gap-1">
                    <p
                      className="truncate font-mono text-xs"
                      title={conversation.traceId || ""}
                    >
                      {conversation.traceId || "-"}
                    </p>
                    {traceId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleCopy(traceId, "追踪ID")}
                      >
                        <Copy className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">会话ID</span>
                  <div className="group flex items-center gap-1">
                    <p
                      className="truncate font-mono text-xs"
                      title={conversation.sessionId || ""}
                    >
                      {conversation.sessionId || "-"}
                    </p>
                    {sessionId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleCopy(sessionId, "会话ID")}
                      >
                        <Copy className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">标签</span>
                  {conversation.tags ? (
                    <div className="flex flex-wrap gap-1">
                      {conversation.tags.split(",").map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">-</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs
            defaultValue="conversation"
            className="flex flex-1 flex-col overflow-hidden px-6"
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="conversation">用户问询</TabsTrigger>
              <TabsTrigger value="metadata">元数据</TabsTrigger>
              <TabsTrigger value="feedback">反馈</TabsTrigger>
            </TabsList>

            <TabsContent
              value="conversation"
              className="mt-4 flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full pb-6">
                <div className="space-y-4">
                  {/* 用户提问 */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">用户提问</h4>
                      <ViewModeToggle
                        mode={queryViewMode}
                        onChange={setQueryViewMode}
                      />
                    </div>
                    {queryViewMode === "rendered" ? (
                      <div className="rounded-md bg-muted p-4 text-sm">
                        <MarkdownRenderer content={displayQuery || ""} />
                        {language === "zh" && !hasQueryTranslation && (
                          <p className="mt-2 text-muted-foreground text-xs">
                            暂无中文翻译
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-xs">
                        {displayQuery || ""}
                        {language === "zh" && !hasQueryTranslation && (
                          <p className="mt-2 text-muted-foreground">
                            暂无中文翻译
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* AI回答 */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">AI回答</h4>
                      <ViewModeToggle
                        mode={responseViewMode}
                        onChange={setResponseViewMode}
                      />
                    </div>
                    {responseViewMode === "rendered" ? (
                      <div className="rounded-md bg-muted p-4 text-sm">
                        <MarkdownRenderer content={displayResponse || ""} />
                        {language === "zh" && !hasResponseTranslation && (
                          <p className="mt-2 text-muted-foreground text-xs">
                            暂无中文翻译
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-xs">
                        {displayResponse || ""}
                        {language === "zh" && !hasResponseTranslation && (
                          <p className="mt-2 text-muted-foreground">
                            暂无中文翻译
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="metadata"
              className="mt-4 flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full pb-6">
                <MetadataRenderer metadata={conversation.metadata || null} />
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="feedback"
              className="mt-4 flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full pb-6">
                <FeedbackPanel
                  latency={conversation.latency}
                  category={conversation.category || null}
                  precision={conversation.precision}
                  relevance={conversation.relevance}
                  languageMatch={conversation.languageMatch}
                  fidelity={conversation.fidelity}
                  scores={conversation.scores || null}
                />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
      <AddToDatasetDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        source="trace"
        conversationId={conversation.id}
        preview={{
          query: conversation.query || "",
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
    <div className="inline-flex h-7 items-center rounded-md border bg-muted p-0.5 text-muted-foreground">
      <button
        onClick={() => onChange("zh")}
        className={cn(
          "inline-flex items-center justify-center rounded-sm px-2.5 py-1 font-medium text-xs transition-colors",
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
          "inline-flex items-center justify-center rounded-sm px-2.5 py-1 font-medium text-xs transition-colors",
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

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="inline-flex h-7 items-center rounded-md border bg-muted p-0.5 text-muted-foreground">
      <button
        onClick={() => onChange("rendered")}
        className={cn(
          "inline-flex items-center justify-center rounded-sm px-2.5 py-1 font-medium text-xs transition-colors",
          mode === "rendered"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50",
        )}
      >
        预览
      </button>
      <button
        onClick={() => onChange("raw")}
        className={cn(
          "inline-flex items-center justify-center rounded-sm px-2.5 py-1 font-medium text-xs transition-colors",
          mode === "raw"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50",
        )}
      >
        源码
      </button>
    </div>
  );
}
