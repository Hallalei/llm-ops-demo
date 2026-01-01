"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Ellipsis,
  Hash,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import type * as React from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableRowAction } from "@/types/data-table";
import type { UserSummary } from "../lib/queries";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<UserSummary> | null>
  >;
}

export function getUsersTableColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<UserSummary>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          id="select-all-users"
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
          id={`select-user-${row.original.externalId}`}
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
      id: "externalId",
      accessorKey: "externalId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="用户ID" />
      ),
      cell: ({ row }) => {
        const externalId = row.getValue<string>("externalId");
        return (
          <button
            onClick={() => setRowAction({ row, variant: "view" })}
            className="max-w-[200px] truncate text-left font-mono text-blue-600 text-xs hover:underline dark:text-blue-400"
            title={externalId}
          >
            {externalId}
          </button>
        );
      },
      meta: {
        label: "用户ID",
        placeholder: "搜索用户ID...",
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "totalConversations",
      accessorKey: "totalConversations",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="对话数" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5 text-muted-foreground" />
          <span className="font-medium">
            {row.getValue("totalConversations")}
          </span>
        </div>
      ),
      meta: { label: "对话数", icon: MessageCircle },
    },
    {
      id: "totalSessions",
      accessorKey: "totalSessions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="会话数" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <MessageSquare className="size-3.5 text-muted-foreground" />
          <span className="font-medium">{row.getValue("totalSessions")}</span>
        </div>
      ),
      meta: { label: "会话数", icon: MessageSquare },
    },
    {
      id: "firstSeenAt",
      accessorKey: "firstSeenAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="首次活跃" />
      ),
      cell: ({ row }) => (
        <div className="w-40 text-muted-foreground text-xs">
          {row.getValue("firstSeenAt") || "-"}
        </div>
      ),
      meta: { label: "首次活跃", variant: "text", icon: CalendarIcon },
    },
    {
      id: "lastSeenAt",
      accessorKey: "lastSeenAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="最后活跃" />
      ),
      cell: ({ row }) => (
        <div className="w-40 text-xs">{row.getValue("lastSeenAt") || "-"}</div>
      ),
      meta: { label: "最后活跃", variant: "text", icon: CalendarIcon },
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
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(row.original.externalId || "")
              }
            >
              复制用户ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 40,
    },
  ];
}
