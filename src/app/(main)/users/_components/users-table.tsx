"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { DataTableRowAction } from "@/types/data-table";
import type {
  UserConversation,
  UserSession,
  UserSummary,
} from "../lib/queries";
import { UserDetailSheet } from "./user-detail-sheet";
import { getUsersTableColumns } from "./users-table-columns";
import { UsersToolbar } from "./users-toolbar";

interface UsersTableProps {
  data: UserSummary[];
  pageCount: number;
}

export function UsersTable({ data, pageCount }: UsersTableProps) {
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<UserSummary> | null>(null);
  const [conversations, setConversations] = React.useState<UserConversation[]>(
    [],
  );
  const [sessions, setSessions] = React.useState<UserSession[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const columns = React.useMemo(
    () => getUsersTableColumns({ setRowAction }),
    [],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "lastSeenAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.externalId,
    shallow: false,
    clearOnDefault: true,
  });

  // 获取用户对话数据
  const fetchUserConversations = React.useCallback(
    async (externalId: string) => {
      try {
        const response = await fetch(
          `/api/users/${encodeURIComponent(externalId)}/conversations`,
        );
        if (response.ok) {
          const data = (await response.json()) as UserConversation[];
          setConversations(data);
        }
      } catch (error) {
        console.error("Failed to fetch user conversations:", error);
      }
    },
    [],
  );

  // 获取用户会话数据
  const fetchUserSessions = React.useCallback(async (externalId: string) => {
    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(externalId)}/sessions`,
      );
      if (response.ok) {
        const data = (await response.json()) as UserSession[];
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch user sessions:", error);
    }
  }, []);

  // 当选中行时，获取用户详情数据
  React.useEffect(() => {
    if (rowAction?.variant === "view") {
      const externalId = rowAction.row.original.externalId;
      setCurrentUserId(externalId);
      fetchUserConversations(externalId);
      fetchUserSessions(externalId);
    }
  }, [rowAction, fetchUserConversations, fetchUserSessions]);

  // 导航到相邻用户
  const handleNavigate = React.useCallback(
    async (externalId: string) => {
      setCurrentUserId(externalId);
      await Promise.all([
        fetchUserConversations(externalId),
        fetchUserSessions(externalId),
      ]);
    },
    [fetchUserConversations, fetchUserSessions],
  );

  // 获取当前用户在列表中的索引
  const currentIndex = React.useMemo(() => {
    if (!currentUserId) return -1;
    return data.findIndex((u) => u.externalId === currentUserId);
  }, [currentUserId, data]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < data.length - 1;

  const handlePrevious = React.useCallback(() => {
    if (hasPrevious) {
      const prevUser = data[currentIndex - 1];
      if (prevUser) {
        handleNavigate(prevUser.externalId);
      }
    }
  }, [hasPrevious, currentIndex, data, handleNavigate]);

  const handleNext = React.useCallback(() => {
    if (hasNext) {
      const nextUser = data[currentIndex + 1];
      if (nextUser) {
        handleNavigate(nextUser.externalId);
      }
    }
  }, [hasNext, currentIndex, data, handleNavigate]);

  // 构造当前用户数据
  const currentUser = React.useMemo(() => {
    if (!currentUserId) return rowAction?.row.original ?? null;
    const found = data.find((u) => u.externalId === currentUserId);
    return found ?? rowAction?.row.original ?? null;
  }, [currentUserId, data, rowAction?.row.original]);

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <UsersToolbar />
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>
      <UserDetailSheet
        open={rowAction?.variant === "view"}
        onOpenChange={() => {
          setRowAction(null);
          setConversations([]);
          setSessions([]);
          setCurrentUserId(null);
        }}
        user={currentUser}
        conversations={conversations}
        sessions={sessions}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    </>
  );
}
