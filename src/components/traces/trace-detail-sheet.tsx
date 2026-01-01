"use client";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Expand,
  FolderPlus,
  Loader2,
  Minimize2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { AddToDatasetDialog } from "@/components/datasets/add-to-dataset-dialog";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/core/utils";
import { MetadataRenderer } from "./metadata-renderer";
import { MetricsOverviewBar } from "./metrics-overview-bar";
import type { TraceData } from "./types";

interface TraceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trace: TraceData | null;
  loading?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  showAddToDataset?: boolean;
}

type ViewMode = "rendered" | "raw";
type Language = "zh" | "original";

function parseJsonObject(
  value: string | Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function TraceDetailSheet({
  open,
  onOpenChange,
  trace,
  loading = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  showAddToDataset = false,
}: TraceDetailSheetProps) {
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

  const handleCopy = async (text: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS environments
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success(`已复制${label}`);
    } catch {
      toast.error("复制失败");
    }
  };

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-[50vw] min-w-[600px] max-w-[900px] flex-col p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>加载中</SheetTitle>
          </SheetHeader>
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!trace) return null;

  const traceId = trace.traceId;
  const sessionId = trace.sessionId;

  const displayQuery =
    language === "zh" && trace.queryZh ? trace.queryZh : trace.query;
  const displayResponse =
    language === "zh" && trace.responseZh ? trace.responseZh : trace.response;
  const hasQueryTranslation = !!trace.queryZh;
  const hasResponseTranslation = !!trace.responseZh;

  const metadata = parseJsonObject(trace.metadata);
  const scores = parseJsonObject(trace.scores);

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
          {/* 标题栏（合并基础信息） */}
          <SheetHeader className="space-y-3 p-6 pb-4">
            {/* 第一行：标题 + 操作按钮 */}
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                对话详情
                <Badge variant={trace.env === "prod" ? "default" : "secondary"}>
                  {trace.env === "prod" ? "生产" : "开发"}
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
                {showAddToDataset && (
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
                )}
                <LanguageToggle language={language} onChange={setLanguage} />
              </div>
            </div>

            {/* 第二行：ID信息 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
              <span>ID: {trace.id}</span>
              <span className="text-border">|</span>
              <div className="group flex items-center gap-1">
                <span>追踪ID:</span>
                <span
                  className="max-w-[120px] truncate font-mono text-xs"
                  title={trace.traceId || ""}
                >
                  {trace.traceId || "-"}
                </span>
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
              <span className="text-border">|</span>
              <div className="group flex items-center gap-1">
                <span>会话ID:</span>
                <span
                  className="max-w-[120px] truncate font-mono text-xs"
                  title={trace.sessionId || ""}
                >
                  {trace.sessionId || "-"}
                </span>
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
              <span className="text-border">|</span>
              <span>用户: {trace.userId || "-"}</span>
            </div>

            {/* 第三行：时间 */}
            <div className="text-muted-foreground text-sm">
              时间: {trace.createdTime || "-"}
            </div>
          </SheetHeader>

          {/* 指标概览条 */}
          <div className="px-6 pb-4">
            <MetricsOverviewBar
              detectedLanguage={trace.detectedLanguage || null}
              latency={trace.latency}
              category={trace.category || null}
              precision={trace.precision}
              relevance={trace.relevance}
              languageMatch={trace.languageMatch}
              fidelity={trace.fidelity}
              scores={scores}
              tags={trace.tags}
            />
          </div>

          {/* Tabs：2个 */}
          <Tabs
            defaultValue="conversation"
            className="flex flex-1 flex-col overflow-hidden px-6"
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="conversation">用户问询</TabsTrigger>
              <TabsTrigger value="details">详细信息</TabsTrigger>
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
              value="details"
              className="mt-4 flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full pb-6">
                <MetadataRenderer metadata={metadata} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
      {showAddToDataset && (
        <AddToDatasetDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          source="trace"
          conversationId={trace.id}
          preview={{
            query: trace.query || "",
          }}
        />
      )}
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
