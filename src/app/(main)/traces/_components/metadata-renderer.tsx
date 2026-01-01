"use client";

import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode,
  Globe,
  Laptop,
  MapPin,
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
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    title: "搜索参数",
    icon: <Search className="size-4" />,
    keys: ["search", "query", "keyword", "q", "searchQuery"],
  },
  {
    title: "页面信息",
    icon: <Globe className="size-4" />,
    keys: ["page", "pageId", "pageName", "route", "path", "url", "pathname"],
  },
  {
    title: "设备信息",
    icon: <Laptop className="size-4" />,
    keys: ["device", "platform", "os", "browser", "userAgent", "deviceType"],
  },
  {
    title: "位置信息",
    icon: <MapPin className="size-4" />,
    keys: ["location", "region", "country", "language", "locale", "timezone"],
  },
  {
    title: "应用上下文",
    icon: <Tag className="size-4" />,
    keys: ["appVersion", "sdkVersion", "environment", "version", "env", "app"],
  },
  {
    title: "请求信息",
    icon: <Server className="size-4" />,
    keys: ["requestId", "traceId", "spanId", "correlationId", "messageId"],
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
  },
];

function categorizeMetadata(metadata: Record<string, unknown>): {
  categorized: Map<string, Record<string, unknown>>;
  uncategorized: Record<string, unknown>;
} {
  const categorized = new Map<string, Record<string, unknown>>();
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
      categorized.set(config.title, categoryData);
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
    return <JsonBlock data={value} />;
  }

  if (typeof value === "object") {
    return <JsonBlock data={value} />;
  }

  return <span className="text-sm">{String(value)}</span>;
}

function LongTextValue({ value }: { value: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div>
      <p className={cn("text-sm", !isExpanded && "line-clamp-2")}>{value}</p>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "收起" : "展开"}
      </Button>
    </div>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
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
        <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
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

function MetadataCategory({
  title,
  icon,
  data,
}: {
  title: string;
  icon: React.ReactNode;
  data: Record<string, unknown>;
}) {
  const isIdField = (key: string) =>
    key.toLowerCase().includes("id") ||
    key.toLowerCase().includes("trace") ||
    key.toLowerCase().includes("request");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
    </Card>
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

  return (
    <div className="space-y-4">
      {CATEGORY_CONFIGS.map((config) => {
        const data = categorized.get(config.title);
        if (!data) return null;
        return (
          <MetadataCategory
            key={config.title}
            title={config.title}
            icon={config.icon}
            data={data}
          />
        );
      })}

      {Object.keys(uncategorized).length > 0 && (
        <MetadataCategory
          title="其他"
          icon={<FileCode className="size-4" />}
          data={uncategorized}
        />
      )}
    </div>
  );
}
