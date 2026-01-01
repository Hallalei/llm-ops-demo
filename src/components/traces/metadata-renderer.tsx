"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  FileCode,
  Globe,
  History,
  Laptop,
  MapPin,
  MessageSquare,
  Search,
  Server,
  Settings,
  Sparkles,
  Tag,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/core/utils";

interface MetadataRendererProps {
  metadata: Record<string, unknown> | null;
}

interface CategoryConfig {
  title: string;
  icon: React.ReactNode;
  keys: string[];
  priority: number;
  defaultExpanded: boolean;
  highlighted?: boolean;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    title: "Prompt上下文",
    icon: <MessageSquare className="size-4" />,
    keys: [
      "history",
      "History",
      "chat_history",
      "Knowledge",
      "knowledge",
      "context",
      "system_prompt",
    ],
    priority: 1,
    defaultExpanded: true,
    highlighted: true,
  },
  {
    title: "问题转写",
    icon: <Edit3 className="size-4" />,
    keys: [
      "query_modify",
      "rewritten_query",
      "modified_query",
      "processed_query",
    ],
    priority: 2,
    defaultExpanded: true,
  },
  {
    title: "模型配置",
    icon: <Settings className="size-4" />,
    keys: [
      "model",
      "temperature",
      "topP",
      "maxTokens",
      "top_p",
      "max_tokens",
      "modelName",
    ],
    priority: 3,
    defaultExpanded: false,
  },
  {
    title: "页面信息",
    icon: <Globe className="size-4" />,
    keys: ["page", "pageId", "pageName", "route", "path", "url", "pathname"],
    priority: 4,
    defaultExpanded: false,
  },
  {
    title: "搜索参数",
    icon: <Search className="size-4" />,
    keys: ["search", "query", "keyword", "q", "searchQuery"],
    priority: 5,
    defaultExpanded: false,
  },
  {
    title: "设备信息",
    icon: <Laptop className="size-4" />,
    keys: ["device", "platform", "os", "browser", "userAgent", "deviceType"],
    priority: 6,
    defaultExpanded: false,
  },
  {
    title: "位置信息",
    icon: <MapPin className="size-4" />,
    keys: ["location", "region", "country", "language", "locale", "timezone"],
    priority: 7,
    defaultExpanded: false,
  },
  {
    title: "应用上下文",
    icon: <Tag className="size-4" />,
    keys: ["appVersion", "sdkVersion", "environment", "version", "env", "app"],
    priority: 8,
    defaultExpanded: false,
  },
  {
    title: "请求信息",
    icon: <Server className="size-4" />,
    keys: ["requestId", "traceId", "spanId", "correlationId", "messageId"],
    priority: 9,
    defaultExpanded: false,
  },
  {
    title: "Token 统计",
    icon: <Sparkles className="size-4" />,
    keys: [
      "inputTokens",
      "outputTokens",
      "totalTokens",
      "usage",
      "tokens",
      "promptTokens",
      "completionTokens",
    ],
    priority: 10,
    defaultExpanded: false,
  },
];

function categorizeMetadata(metadata: Record<string, unknown>): {
  categorized: Map<
    string,
    { config: CategoryConfig; data: Record<string, unknown> }
  >;
  uncategorized: Record<string, unknown>;
} {
  const categorized = new Map<
    string,
    { config: CategoryConfig; data: Record<string, unknown> }
  >();
  const uncategorized: Record<string, unknown> = {};
  const usedKeys = new Set<string>();

  for (const config of CATEGORY_CONFIGS) {
    const categoryData: Record<string, unknown> = {};
    for (const key of config.keys) {
      if (key in metadata) {
        categoryData[key] = metadata[key];
        usedKeys.add(key);
      }
    }
    if (Object.keys(categoryData).length > 0) {
      categorized.set(config.title, { config, data: categoryData });
    }
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (!usedKeys.has(key)) {
      uncategorized[key] = value;
    }
  }

  return { categorized, uncategorized };
}

function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "是" : "否"}
      </Badge>
    );
  }

  if (typeof value === "number") {
    return <span className="font-mono text-sm">{value.toLocaleString()}</span>;
  }

  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary text-sm underline-offset-4 hover:underline"
        >
          {value}
        </a>
      );
    }

    if (/^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}:\d{2}/.test(value)) {
      try {
        const date = new Date(value);
        return (
          <span className="text-sm">
            {date.toLocaleString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        );
      } catch {
        return <span className="text-sm">{value}</span>;
      }
    }

    if (value.length > 100) {
      return <LongTextValue value={value} />;
    }

    return <span className="break-all text-sm">{value}</span>;
  }

  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <Badge key={i} variant="outline">
              {String(v)}
            </Badge>
          ))}
        </div>
      );
    }
    return <JsonBlock data={value} defaultExpanded />;
  }

  if (typeof value === "object") {
    return <JsonBlock data={value} defaultExpanded />;
  }

  return <span className="text-sm">{String(value)}</span>;
}

function LongTextValue({ value }: { value: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div>
      <p
        className={cn(
          "whitespace-pre-wrap text-sm",
          !isExpanded && "line-clamp-3",
        )}
      >
        {value}
      </p>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "收起" : "展开全部"}
      </Button>
    </div>
  );
}

function JsonBlock({
  data,
  defaultExpanded = false,
}: {
  data: unknown;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    toast.success("已复制到剪贴板");
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-2">
            {isExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            <span className="text-xs">
              {Array.isArray(data)
                ? `数组 (${data.length} 项)`
                : `对象 (${Object.keys(data as object).length} 个字段)`}
            </span>
          </Button>
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={handleCopy}
        >
          <Copy className="size-3" />
        </Button>
      </div>
      <CollapsibleContent>
        <pre className="mt-2 max-h-[400px] overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
          {jsonString}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CopyableValue({ value, label }: { value: string; label?: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`已复制${label || "内容"}`);
  };

  return (
    <div className="group flex items-center gap-1">
      <span className="break-all font-mono text-xs">{value}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={handleCopy}
      >
        <Copy className="size-3" />
      </Button>
    </div>
  );
}

function PromptContextCard({ data }: { data: Record<string, unknown> }) {
  const historyData = data.history || data.History || data.chat_history;
  const knowledgeData = data.Knowledge || data.knowledge;
  const hasHistory = historyData !== undefined && historyData !== null;
  const hasKnowledge = knowledgeData !== undefined && knowledgeData !== null;

  const handleCopyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success("已复制全部上下文");
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="size-4 text-primary" />
            Prompt上下文
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={handleCopyAll}
          >
            <Copy className="mr-1 size-3" />
            复制全部
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 历史对话 */}
        {hasHistory ? (
          <ContextSection
            title="历史对话"
            icon={<History className="size-4" />}
            data={historyData}
          />
        ) : null}

        {/* 知识库 */}
        {hasKnowledge ? (
          <ContextSection
            title="知识库"
            icon={<BookOpen className="size-4" />}
            data={knowledgeData}
          />
        ) : null}

        {/* 其他上下文字段 */}
        {Object.entries(data)
          .filter(
            ([key]) =>
              ![
                "history",
                "History",
                "chat_history",
                "Knowledge",
                "knowledge",
              ].includes(key),
          )
          .map(([key, value]) => (
            <ContextSection key={key} title={key} data={value} />
          ))}
      </CardContent>
    </Card>
  );
}

function ContextSection({
  title,
  icon,
  data,
}: {
  title: string;
  icon?: React.ReactNode;
  data: unknown;
}) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const handleCopy = () => {
    const text =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    toast.success(`已复制${title}`);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex items-center justify-between rounded-t-md bg-muted/50 px-3 py-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 gap-2 px-1">
            {isExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            {icon || <FileCode className="size-4" />}
            <span className="font-medium text-sm">{title}</span>
          </Button>
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={handleCopy}
        >
          <Copy className="size-3" />
        </Button>
      </div>
      <CollapsibleContent>
        <div className="rounded-b-md border border-t-0 bg-background p-3">
          {typeof data === "string" ? (
            <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap font-mono text-xs">
              {data}
            </pre>
          ) : (
            <pre className="max-h-[300px] overflow-auto font-mono text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function QueryModifyCard({ data }: { data: Record<string, unknown> }) {
  const modifyValue =
    data.query_modify ||
    data.rewritten_query ||
    data.modified_query ||
    data.processed_query;

  const handleCopy = () => {
    const text =
      typeof modifyValue === "string"
        ? modifyValue
        : JSON.stringify(modifyValue, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("已复制问题转写");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Edit3 className="size-4" />
            问题转写
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={handleCopy}
          >
            <Copy className="mr-1 size-3" />
            复制
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {typeof modifyValue === "string" ? (
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm">{modifyValue}</p>
          </div>
        ) : (
          <pre className="max-h-[200px] overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
            {JSON.stringify(modifyValue, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

function CollapsibleMetadataCategory({
  title,
  icon,
  data,
  defaultExpanded = false,
}: {
  title: string;
  icon: React.ReactNode;
  data: Record<string, unknown>;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const isIdField = (key: string) =>
    key.toLowerCase().includes("id") ||
    key.toLowerCase().includes("trace") ||
    key.toLowerCase().includes("request");

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3 hover:bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-sm">
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              {icon}
              {title}
              <Badge variant="secondary" className="ml-auto text-xs">
                {Object.keys(data).length} 项
              </Badge>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">{key}</span>
                  {isIdField(key) && typeof value === "string" ? (
                    <CopyableValue value={value} label={key} />
                  ) : (
                    formatValue(value)
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function MetadataRenderer({ metadata }: MetadataRendererProps) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileCode className="mb-2 size-8" />
        <p>暂无元数据</p>
      </div>
    );
  }

  const { categorized, uncategorized } = categorizeMetadata(metadata);

  // 按优先级排序
  const sortedCategories = Array.from(categorized.entries()).sort(
    ([, a], [, b]) => a.config.priority - b.config.priority,
  );

  // 分离出Prompt上下文和问题转写
  const promptContext = categorized.get("Prompt上下文");
  const queryModify = categorized.get("问题转写");

  // 其他分类
  const otherCategories = sortedCategories.filter(
    ([title]) => title !== "Prompt上下文" && title !== "问题转写",
  );

  return (
    <div className="space-y-4">
      {/* Prompt上下文 - 最高优先级，突出显示 */}
      {promptContext && <PromptContextCard data={promptContext.data} />}

      {/* 问题转写 - 次高优先级 */}
      {queryModify && <QueryModifyCard data={queryModify.data} />}

      {/* 其他分类 - 折叠显示 */}
      {otherCategories.map(([title, { config, data }]) => (
        <CollapsibleMetadataCategory
          key={title}
          title={title}
          icon={config.icon}
          data={data}
          defaultExpanded={config.defaultExpanded}
        />
      ))}

      {/* 未分类的其他数据 */}
      {Object.keys(uncategorized).length > 0 && (
        <CollapsibleMetadataCategory
          title="其他"
          icon={<FileCode className="size-4" />}
          data={uncategorized}
          defaultExpanded={false}
        />
      )}
    </div>
  );
}
