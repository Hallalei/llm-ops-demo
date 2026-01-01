"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Loader2,
} from "lucide-react";
import * as React from "react";
import { type TraceData, TraceDetailSheet } from "@/components/traces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/core/utils";

interface TraceItem {
  id: number;
  createdTime: string | null;
  sessionId: string | null;
  tags: string | null;
  env: string | null;
  userId: string | null;
  query: string | null;
  queryZh: string | null;
  category: string | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface TraceListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  filterType: string;
  filterValue: string;
  days: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  product_inquiry: "产品咨询",
  technical_support: "技术支持",
  order_service: "订单服务",
  complaint: "投诉建议",
  other: "其他",
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function TraceListDialog({
  open,
  onOpenChange,
  title,
  filterType,
  filterValue,
  days,
}: TraceListDialogProps) {
  const [data, setData] = React.useState<TraceItem[]>([]);
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = React.useState(false);
  const [selectedTraceId, setSelectedTraceId] = React.useState<number | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [traceDetail, setTraceDetail] = React.useState<TraceData | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const fetchData = React.useCallback(
    async (page: number, pageSize: number) => {
      if (!filterType || !filterValue) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/traces?filterType=${encodeURIComponent(filterType)}&filterValue=${encodeURIComponent(filterValue)}&days=${days}&page=${page}&pageSize=${pageSize}`,
        );
        const result = (await res.json()) as {
          data: TraceItem[];
          pagination?: Pagination;
        };
        setData(result.data || []);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } catch (err) {
        console.error("Failed to fetch traces:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [filterType, filterValue, days],
  );

  const fetchTraceDetail = React.useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const detail = (await res.json()) as TraceData;
        setTraceDetail(detail);
      }
    } catch (err) {
      console.error("Failed to fetch trace detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    fetchData(1, pagination.pageSize);
  }, [open, fetchData, pagination.pageSize]);

  React.useEffect(() => {
    if (detailOpen && selectedTraceId) {
      fetchTraceDetail(selectedTraceId);
    }
  }, [detailOpen, selectedTraceId, fetchTraceDetail]);

  const handlePageChange = (newPage: number) => {
    fetchData(newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    fetchData(1, Number(newPageSize));
  };

  const handleViewDetail = (traceId: number) => {
    setSelectedTraceId(traceId);
    setDetailOpen(true);
  };

  const formatTime = (time: string | null) => {
    if (!time) return "-";
    try {
      return format(new Date(time), "MM-dd HH:mm", { locale: zhCN });
    } catch {
      return time;
    }
  };

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const { page, pageSize, total, totalPages } = pagination;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-6xl flex max-h-[90vh] min-h-[70vh] w-[95vw] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-semibold text-lg">
                {title}
              </DialogTitle>
              {!loading && total > 0 && (
                <Badge variant="secondary" className="font-normal">
                  共 {total.toLocaleString("zh-CN")} 条记录
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-auto">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">加载中...</span>
              </div>
            ) : data.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2">
                <div className="rounded-full bg-muted p-4">
                  <Eye className="h-8 w-8 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">暂无数据</span>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[70px] font-semibold">ID</TableHead>
                    <TableHead className="w-[100px] font-semibold">
                      时间
                    </TableHead>
                    <TableHead className="w-[60px] font-semibold">
                      环境
                    </TableHead>
                    <TableHead className="font-semibold">问题</TableHead>
                    <TableHead className="w-[90px] font-semibold">
                      分类
                    </TableHead>
                    <TableHead className="w-[60px] text-center font-semibold">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        index % 2 === 0 ? "bg-background" : "bg-muted/30",
                        "hover:bg-accent",
                      )}
                      onClick={() => handleViewDetail(item.id)}
                    >
                      <TableCell className="font-mono text-muted-foreground text-xs">
                        {item.id}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatTime(item.createdTime)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.env === "prod" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {item.env || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate text-sm">
                              {truncateText(item.queryZh || item.query, 60)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-md whitespace-pre-wrap"
                          >
                            {item.queryZh || item.query || "-"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(item.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>查看详情</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>每页</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>条</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="mr-2 text-muted-foreground text-sm">
                  第 {page} / {totalPages} 页
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(1)}
                      disabled={page <= 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>首页</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>上一页</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>下一页</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={page >= totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>末页</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TraceDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setTraceDetail(null);
          }
        }}
        trace={traceDetail}
        loading={detailLoading}
        hasPrevious={
          selectedTraceId !== null &&
          data.findIndex((d) => d.id === selectedTraceId) > 0
        }
        hasNext={
          selectedTraceId !== null &&
          data.findIndex((d) => d.id === selectedTraceId) < data.length - 1
        }
        onPrevious={() => {
          if (selectedTraceId === null) return;
          const currentIndex = data.findIndex((d) => d.id === selectedTraceId);
          if (currentIndex <= 0) return;

          const prev = data[currentIndex - 1];
          if (!prev) return;
          setSelectedTraceId(prev.id);
        }}
        onNext={() => {
          if (selectedTraceId === null) return;
          const currentIndex = data.findIndex((d) => d.id === selectedTraceId);
          if (currentIndex < 0 || currentIndex >= data.length - 1) return;

          const next = data[currentIndex + 1];
          if (!next) return;
          setSelectedTraceId(next.id);
        }}
      />
    </>
  );
}
