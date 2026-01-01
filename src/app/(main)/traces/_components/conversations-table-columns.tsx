"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Check,
  Clock,
  Ellipsis,
  Eye,
  FolderPlus,
  Globe,
  Hash,
  MessageSquare,
  Server,
  Tag,
  Target,
  Text,
  User,
} from "lucide-react";
import type * as React from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScoreBar } from "@/components/ui/score-bar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/core/utils";
import type { DataTableRowAction } from "@/types/data-table";
import type { ConversationWithExtras } from "../_lib/queries";

interface CategoryOption {
  id: string;
  name: string;
}

interface LanguageOption {
  code: string;
  name: string;
  nameEn: string;
}

interface ReviewStatus {
  status: "reviewed" | "flagged" | "skipped";
  reviewedAt: Date;
}

type ReviewMap = Record<number, ReviewStatus>;

interface GetColumnsProps {
  envCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  categoryOptions: CategoryOption[];
  languageCounts: Record<string, number>;
  languageOptions: LanguageOption[];
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<ConversationWithExtras> | null>
  >;
  reviews?: ReviewMap;
  canEdit?: boolean;
}

export function getConversationsTableColumns({
  envCounts,
  categoryCounts,
  categoryOptions,
  languageCounts,
  languageOptions,
  setRowAction,
  reviews = {},
  canEdit = true,
}: GetColumnsProps): ColumnDef<ConversationWithExtras>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          id="select-all-traces"
          aria-label="全选"
          className="translate-y-0.5"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          id={`select-trace-${row.original.id}`}
          aria-label="选择行"
          className="translate-y-0.5"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "reviewStatus",
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <Eye className="size-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>已读状态</TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => {
        const review = reviews[row.original.id];
        const isReviewed = !!review;
        return (
          <div className="flex items-center justify-center">
            {isReviewed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full",
                      review.status === "reviewed" &&
                        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                      review.status === "flagged" &&
                        "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                      review.status === "skipped" &&
                        "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    <Check className="size-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {review.status === "reviewed" && "已查看"}
                  {review.status === "flagged" && "已标记问题"}
                  {review.status === "skipped" && "已跳过"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="size-5 rounded-full border-2 border-muted-foreground/30 border-dashed" />
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      id: "id",
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="ID" />
      ),
      cell: ({ row }) => (
        <div className="w-16 font-mono text-xs">{row.getValue("id")}</div>
      ),
      meta: { label: "ID", icon: Hash },
      size: 80,
    },
    {
      id: "createdTime",
      accessorKey: "createdTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="创建时间" />
      ),
      cell: ({ row }) => (
        <div className="w-40 text-xs">{row.getValue("createdTime")}</div>
      ),
      meta: { label: "创建时间", variant: "text", icon: CalendarIcon },
    },
    {
      id: "query",
      accessorKey: "query",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="用户提问" />
      ),
      cell: ({ row }) => {
        const query = row.getValue<string>("query");
        return (
          <div className="max-w-[300px]">
            <p className="truncate text-sm" title={query}>
              {query}
            </p>
          </div>
        );
      },
      meta: {
        label: "用户提问",
        placeholder: "搜索提问内容...",
        variant: "text",
        icon: MessageSquare,
      },
      enableColumnFilter: true,
    },
    {
      id: "response",
      accessorKey: "response",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="AI回答" />
      ),
      cell: ({ row }) => {
        const response = row.getValue<string>("response");
        return (
          <div className="max-w-[400px]">
            <p className="line-clamp-2 text-sm" title={response}>
              {response}
            </p>
          </div>
        );
      },
      meta: { label: "AI回答", variant: "text", icon: Text },
    },
    {
      id: "queryZh",
      accessorKey: "queryZh",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="提问(中文)" />
      ),
      cell: ({ row }) => {
        const queryZh = row.getValue<string | null>("queryZh");
        if (!queryZh) {
          return <span className="text-muted-foreground text-xs">-</span>;
        }
        return (
          <div className="max-w-[300px]">
            <p className="truncate text-sm" title={queryZh}>
              {queryZh}
            </p>
          </div>
        );
      },
      meta: { label: "提问(中文)", variant: "text", icon: MessageSquare },
    },
    {
      id: "responseZh",
      accessorKey: "responseZh",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="回答(中文)" />
      ),
      cell: ({ row }) => {
        const responseZh = row.getValue<string | null>("responseZh");
        if (!responseZh) {
          return <span className="text-muted-foreground text-xs">-</span>;
        }
        return (
          <div className="max-w-[400px]">
            <p className="line-clamp-2 text-sm" title={responseZh}>
              {responseZh}
            </p>
          </div>
        );
      },
      meta: { label: "回答(中文)", variant: "text", icon: Text },
    },
    {
      id: "env",
      accessorKey: "env",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="环境" />
      ),
      cell: ({ row }) => {
        const env = row.getValue<string>("env");
        return (
          <Badge variant={env === "prod" ? "default" : "secondary"}>
            {env === "prod" ? "生产" : "开发"}
          </Badge>
        );
      },
      meta: {
        label: "环境",
        variant: "multiSelect",
        options: [
          { label: "生产", value: "prod", count: envCounts.prod ?? 0 },
          { label: "开发", value: "dev", count: envCounts.dev ?? 0 },
        ],
        icon: Server,
      },
      enableColumnFilter: true,
    },
    {
      id: "category",
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="意图分类" />
      ),
      cell: ({ row }) => {
        const category = row.getValue<string | null>("category");
        if (!category) {
          return <span className="text-muted-foreground text-xs">-</span>;
        }
        const option = categoryOptions.find((opt) => opt.id === category);
        return <Badge variant="outline">{option?.name || category}</Badge>;
      },
      meta: {
        label: "意图分类",
        variant: "multiSelect",
        options: categoryOptions.map((opt) => ({
          label: opt.name,
          value: opt.id,
          count: categoryCounts[opt.id] ?? 0,
        })),
        icon: Target,
      },
      enableColumnFilter: true,
    },
    {
      id: "detectedLanguage",
      accessorKey: "detectedLanguage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="语种" />
      ),
      cell: ({ row }) => {
        const language = row.getValue<string | null>("detectedLanguage");
        if (!language) {
          return <span className="text-muted-foreground text-xs">-</span>;
        }
        const option = languageOptions.find((opt) => opt.code === language);
        // 未知语种代码显示为"其他"
        const displayName =
          option?.name ||
          languageOptions.find((opt) => opt.code === "other")?.name ||
          "其他";
        return <Badge variant="secondary">{displayName}</Badge>;
      },
      meta: {
        label: "语种",
        variant: "multiSelect",
        options: languageOptions.map((opt) => ({
          label: opt.name,
          value: opt.code,
          count: languageCounts[opt.code] ?? 0,
        })),
        icon: Globe,
      },
      enableColumnFilter: true,
    },
    {
      id: "tags",
      accessorKey: "tags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="标签" />
      ),
      cell: ({ row }) => {
        const tags = row.getValue<string>("tags");
        if (!tags) return null;
        return (
          <div className="flex max-w-[200px] flex-wrap gap-1">
            {tags
              .split(",")
              .slice(0, 3)
              .map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag.trim()}
                </Badge>
              ))}
            {tags.split(",").length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.split(",").length - 3}
              </Badge>
            )}
          </div>
        );
      },
      meta: {
        label: "标签",
        placeholder: "搜索标签...",
        variant: "text",
        icon: Tag,
      },
      enableColumnFilter: true,
    },
    {
      id: "latency",
      accessorKey: "latency",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="延迟" />
      ),
      cell: ({ row }) => (
        <div className="w-16 text-right text-xs">
          {row.getValue("latency")}s
        </div>
      ),
      meta: { label: "延迟", icon: Clock },
    },
    {
      id: "precision",
      accessorKey: "precision",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="精准度" />
      ),
      cell: ({ row }) => {
        const value = row.getValue<string | null>("precision");
        const num = value ? parseFloat(value) : null;
        return num !== null && !Number.isNaN(num) ? (
          <ScoreBar label="" value={num} className="w-24" />
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
      meta: { label: "精准度" },
    },
    {
      id: "relevance",
      accessorKey: "relevance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="相关性" />
      ),
      cell: ({ row }) => {
        const value = row.getValue<string | null>("relevance");
        const num = value ? parseFloat(value) : null;
        return num !== null && !Number.isNaN(num) ? (
          <ScoreBar label="" value={num} className="w-24" />
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
      meta: { label: "相关性" },
    },
    {
      id: "languageMatch",
      accessorKey: "languageMatch",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="语言匹配率" />
      ),
      cell: ({ row }) => {
        const value = row.getValue<string | null>("languageMatch");
        const num = value ? parseFloat(value) : null;
        return num !== null && !Number.isNaN(num) ? (
          <ScoreBar label="" value={num} className="w-24" />
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
      meta: { label: "语言匹配率" },
    },
    {
      id: "fidelity",
      accessorKey: "fidelity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="忠诚度" />
      ),
      cell: ({ row }) => {
        const value = row.getValue<string | null>("fidelity");
        const num = value ? parseFloat(value) : null;
        return num !== null && !Number.isNaN(num) ? (
          <ScoreBar label="" value={num} className="w-24" />
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
      meta: { label: "忠诚度" },
    },
    {
      id: "userId",
      accessorKey: "userId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="用户ID" />
      ),
      cell: ({ row }) => (
        <div className="w-24 truncate font-mono text-xs">
          {row.getValue("userId")}
        </div>
      ),
      meta: {
        label: "用户ID",
        placeholder: "搜索用户ID...",
        variant: "text",
        icon: User,
      },
      enableColumnFilter: true,
    },
    {
      id: "sessionId",
      accessorKey: "sessionId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="会话ID" />
      ),
      cell: ({ row }) => (
        <div className="w-32 truncate font-mono text-xs">
          {row.getValue("sessionId")}
        </div>
      ),
      meta: {
        label: "会话ID",
        placeholder: "搜索会话ID...",
        variant: "text",
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="打开菜单"
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
            >
              <Ellipsis className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => setRowAction({ row, variant: "view" })}
            >
              查看详情
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem
                onClick={() => setRowAction({ row, variant: "addToDataset" })}
              >
                <FolderPlus className="mr-2 size-4" />
                添加到数据集
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(row.original.query || "")
              }
            >
              复制提问
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(row.original.response || "")
              }
            >
              复制回答
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 40,
    },
  ];
}
