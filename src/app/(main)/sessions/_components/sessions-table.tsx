"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { useDataTable } from "@/hooks/use-data-table";
import type { DataTableRowAction } from "@/types/data-table";
import type { SessionConversation, SessionSummary } from "../lib/queries";
import { SessionDetailSheet } from "./session-detail-sheet";
import { getSessionsTableColumns } from "./sessions-table-columns";

interface SessionsTableProps {
  data: SessionSummary[];
  pageCount: number;
}

interface AdjacentSessions {
  prevSessionId: string | null;
  nextSessionId: string | null;
}

export function SessionsTable({ data, pageCount }: SessionsTableProps) {
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<SessionSummary> | null>(null);
  const [conversations, setConversations] = React.useState<
    SessionConversation[]
  >([]);
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(
    null,
  );
  const [adjacentSessions, setAdjacentSessions] =
    React.useState<AdjacentSessions>({
      prevSessionId: null,
      nextSessionId: null,
    });

  const columns = React.useMemo(
    () => getSessionsTableColumns({ setRowAction }),
    [],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "lastMessageTime", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.sessionId,
    shallow: false,
    clearOnDefault: true,
  });

  // 获取会话对话数据
  const fetchConversations = React.useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(sessionId)}/conversations`,
      );
      if (response.ok) {
        const data = (await response.json()) as SessionConversation[];
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  }, []);

  // 获取相邻会话 ID
  const fetchAdjacentSessions = React.useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(sessionId)}/adjacent`,
      );
      if (response.ok) {
        const data = (await response.json()) as AdjacentSessions;
        setAdjacentSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch adjacent sessions:", error);
      setAdjacentSessions({ prevSessionId: null, nextSessionId: null });
    }
  }, []);

  // 当选中行时，获取对话数据和相邻会话
  React.useEffect(() => {
    if (rowAction?.variant === "view") {
      const sessionId = rowAction.row.original.sessionId;
      setCurrentSessionId(sessionId);
      fetchConversations(sessionId);
      fetchAdjacentSessions(sessionId);
    }
  }, [rowAction, fetchConversations, fetchAdjacentSessions]);

  // 导航到相邻会话
  const handleNavigate = React.useCallback(
    async (sessionId: string) => {
      setCurrentSessionId(sessionId);
      await Promise.all([
        fetchConversations(sessionId),
        fetchAdjacentSessions(sessionId),
      ]);
    },
    [fetchConversations, fetchAdjacentSessions],
  );

  const handlePrevious = React.useCallback(() => {
    if (adjacentSessions.prevSessionId) {
      handleNavigate(adjacentSessions.prevSessionId);
    }
  }, [adjacentSessions.prevSessionId, handleNavigate]);

  const handleNext = React.useCallback(() => {
    if (adjacentSessions.nextSessionId) {
      handleNavigate(adjacentSessions.nextSessionId);
    }
  }, [adjacentSessions.nextSessionId, handleNavigate]);

  // 构造当前会话摘要（用于侧边栏显示）
  const currentSession = React.useMemo(() => {
    if (!currentSessionId) return rowAction?.row.original ?? null;
    // 优先从当前页数据中查找
    const found = data.find((s) => s.sessionId === currentSessionId);
    if (found) return found;
    // 如果不在当前页，根据对话数据构建基本信息
    if (conversations.length > 0) {
      const first = conversations[0];
      const last = conversations[conversations.length - 1];
      return {
        sessionId: currentSessionId,
        userId: first?.userId ?? null,
        env: first?.env ?? null,
        messageCount: conversations.length,
        firstMessageTime: first?.createdTime ?? null,
        lastMessageTime: last?.createdTime ?? null,
      } as SessionSummary;
    }
    return rowAction?.row.original ?? null;
  }, [currentSessionId, data, conversations, rowAction?.row.original]);

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DateRangePicker />
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>
      <SessionDetailSheet
        open={rowAction?.variant === "view"}
        onOpenChange={() => {
          setRowAction(null);
          setConversations([]);
          setCurrentSessionId(null);
          setAdjacentSessions({ prevSessionId: null, nextSessionId: null });
        }}
        session={currentSession}
        conversations={conversations}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={!!adjacentSessions.prevSessionId}
        hasNext={!!adjacentSessions.nextSessionId}
      />
    </>
  );
}
