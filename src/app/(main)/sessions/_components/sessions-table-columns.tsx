"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Ellipsis,
  Hash,
  MessageSquare,
  Server,
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
import type { DataTableRowAction } from "@/types/data-table";
import type { SessionSummary } from "../lib/queries";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<SessionSummary> | null>
  >;
}

export function getSessionsTableColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<SessionSummary>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          id="select-all-sessions"
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
          id={`select-session-${row.original.sessionId}`}
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
      id: "sessionId",
      accessorKey: "sessionId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="会话ID" />
      ),
      cell: ({ row }) => {
        const sessionId = row.getValue<string>("sessionId");
        return (
          <button
            onClick={() => setRowAction({ row, variant: "view" })}
            className="max-w-[200px] truncate text-left font-mono text-blue-600 text-xs hover:underline dark:text-blue-400"
            title={sessionId}
          >
            {sessionId?.slice(0, 16)}...
          </button>
        );
      },
      meta: {
        label: "会话ID",
        placeholder: "搜索会话ID...",
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    },
    {
      id: "userId",
      accessorKey: "userId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="用户ID" />
      ),
      cell: ({ row }) => (
        <div className="w-24 truncate font-mono text-xs">
          {row.getValue("userId") || "-"}
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
      id: "messageCount",
      accessorKey: "messageCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="消息数" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <MessageSquare className="size-3.5 text-muted-foreground" />
          <span className="font-medium">{row.getValue("messageCount")}</span>
        </div>
      ),
      meta: { label: "消息数", icon: MessageSquare },
    },
    {
      id: "firstMessageTime",
      accessorKey: "firstMessageTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="首次对话" />
      ),
      cell: ({ row }) => (
        <div className="w-40 text-muted-foreground text-xs">
          {row.getValue("firstMessageTime") || "-"}
        </div>
      ),
      meta: { label: "首次对话", variant: "text", icon: CalendarIcon },
    },
    {
      id: "lastMessageTime",
      accessorKey: "lastMessageTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="最后对话" />
      ),
      cell: ({ row }) => (
        <div className="w-40 text-xs">
          {row.getValue("lastMessageTime") || "-"}
        </div>
      ),
      meta: { label: "最后对话", variant: "text", icon: CalendarIcon },
    },
    {
      id: "env",
      accessorKey: "env",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="环境" />
      ),
      cell: ({ row }) => {
        const env = row.getValue<string>("env");
        if (!env) return <span className="text-muted-foreground">-</span>;
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
          { label: "生产", value: "prod" },
          { label: "开发", value: "dev" },
        ],
        icon: Server,
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
              查看对话
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(row.original.sessionId || "")
              }
            >
              复制会话ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 40,
    },
  ];
}
