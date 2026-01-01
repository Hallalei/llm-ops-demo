"use client";

import type { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import * as React from "react";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QualityQuickFilter } from "./quality-quick-filter";

interface ConversationsToolbarProps<TData> {
  table: Table<TData>;
  totalCount?: number;
  filteredCount?: number;
}

export function ConversationsToolbar<TData>({
  table,
  totalCount,
  filteredCount,
}: ConversationsToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const queryColumn = table.getColumn("query");
  const userIdColumn = table.getColumn("userId");
  const categoryColumn = table.getColumn("category");

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <div className="flex flex-col gap-2 px-1 py-2">
      {/* 第一行：质量筛选快捷按钮 */}
      <div className="flex items-center gap-2">
        <QualityQuickFilter />
      </div>

      {/* 第二行：其他筛选器 */}
      <div className="flex items-center justify-between gap-4">
        {/* 左侧：筛选器 */}
        <div className="flex items-center gap-2">
          <DateRangePicker />

          {/* 搜索提问内容 */}
          {queryColumn && (
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="search-query"
                placeholder="搜索提问内容..."
                value={(queryColumn.getFilterValue() as string) ?? ""}
                onChange={(e) => queryColumn.setFilterValue(e.target.value)}
                className="h-8 w-[160px] pl-8 text-sm"
              />
            </div>
          )}

          {/* 搜索用户ID */}
          {userIdColumn && (
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="search-user-id"
                placeholder="搜索用户ID..."
                value={(userIdColumn.getFilterValue() as string) ?? ""}
                onChange={(e) => userIdColumn.setFilterValue(e.target.value)}
                className="h-8 w-[130px] pl-8 text-sm"
              />
            </div>
          )}

          {/* 意图分类筛选 */}
          {categoryColumn && (
            <DataTableFacetedFilter
              column={categoryColumn}
              title="意图分类"
              options={categoryColumn.columnDef.meta?.options ?? []}
              multiple
            />
          )}

          {/* 重置筛选 */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground"
              onClick={onReset}
            >
              <X className="size-4" />
              重置
            </Button>
          )}
        </div>

        {/* 右侧：统计 + 排序/视图 */}
        <div className="flex items-center gap-3">
          {totalCount !== undefined && (
            <span className="text-muted-foreground text-sm tabular-nums">
              {filteredCount !== undefined && filteredCount !== totalCount
                ? `${filteredCount.toLocaleString()} / ${totalCount.toLocaleString()}`
                : totalCount.toLocaleString()}
            </span>
          )}
          <DataTableSortList table={table} align="end" />
          <DataTableViewOptions table={table} align="end" />
        </div>
      </div>
    </div>
  );
}
