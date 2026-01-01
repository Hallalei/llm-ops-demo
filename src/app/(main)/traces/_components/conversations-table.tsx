"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { AddToDatasetDialog } from "@/components/datasets/add-to-dataset-dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { TraceDetailSheet } from "@/components/traces";
import { useConversationReviews } from "@/hooks/use-conversation-reviews";
import { useDataTable } from "@/hooks/use-data-table";
import type { DataTableRowAction, QueryKeys } from "@/types/data-table";
import type {
  ConversationWithExtras,
  getCategoryCounts,
  getConversations,
  getEnvCounts,
  getLanguageCounts,
} from "../_lib/queries";
import { ConversationsTableActionBar } from "./conversations-table-action-bar";
import { getConversationsTableColumns } from "./conversations-table-columns";
import { ConversationsToolbar } from "./conversations-toolbar";

interface CategoryOption {
  id: string;
  name: string;
}

interface LanguageOption {
  code: string;
  name: string;
  nameEn: string;
}

interface ConversationsTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getConversations>>,
      Awaited<ReturnType<typeof getEnvCounts>>,
      Awaited<ReturnType<typeof getCategoryCounts>>,
      CategoryOption[],
      Awaited<ReturnType<typeof getLanguageCounts>>,
      LanguageOption[],
    ]
  >;
  queryKeys?: Partial<QueryKeys>;
}

interface AdjacentConversations {
  prevId: number | null;
  nextId: number | null;
}

export function ConversationsTable({
  promises,
  queryKeys,
}: ConversationsTableProps) {
  const { canEdit } = useAuth();
  const [
    { data, pageCount },
    envCounts,
    categoryCounts,
    categoryOptions,
    languageCounts,
    languageOptions,
  ] = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<ConversationWithExtras> | null>(null);
  const [currentConversation, setCurrentConversation] =
    React.useState<ConversationWithExtras | null>(null);
  const [adjacentConversations, setAdjacentConversations] =
    React.useState<AdjacentConversations>({
      prevId: null,
      nextId: null,
    });
  const [isNavigating, setIsNavigating] = React.useState(false);

  // 请求序号 ref，用于处理竞态条件
  const requestIdRef = React.useRef(0);

  // 追踪当前正在查看的对话 ID，用于防止重复请求
  const viewingConversationIdRef = React.useRef<number | null>(null);

  // 获取当前页数据的审核状态
  const conversationIds = React.useMemo(() => data.map((c) => c.id), [data]);
  const { reviews, markAsReviewed, isReviewed } =
    useConversationReviews(conversationIds);

  const columns = React.useMemo(
    () =>
      getConversationsTableColumns({
        envCounts,
        categoryCounts,
        categoryOptions,
        languageCounts,
        languageOptions,
        setRowAction,
        reviews,
        canEdit,
      }),
    [
      envCounts,
      categoryCounts,
      categoryOptions,
      languageCounts,
      languageOptions,
      reviews,
      canEdit,
    ],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: false,
    initialState: {
      sorting: [{ id: "id", desc: true }],
      columnPinning: { right: ["actions"] },
      columnVisibility: {
        sessionId: false,
        traceId: false,
      },
    },
    queryKeys,
    getRowId: (originalRow) => String(originalRow.id),
    shallow: false,
    clearOnDefault: true,
  });

  // 获取相邻对话 ID（传递当前 URL 筛选参数）
  const fetchAdjacentConversations = React.useCallback(
    async (conversationId: number) => {
      try {
        // 获取当前 URL 的筛选参数
        const currentParams = new URLSearchParams(window.location.search);
        // 移除分页参数，保留筛选和排序参数
        currentParams.delete("page");
        currentParams.delete("perPage");

        const queryString = currentParams.toString();
        const url = queryString
          ? `/api/conversations/${conversationId}/adjacent?${queryString}`
          : `/api/conversations/${conversationId}/adjacent`;

        const response = await fetch(url);
        if (response.ok) {
          const data = (await response.json()) as AdjacentConversations;
          setAdjacentConversations(data);
        }
      } catch (error) {
        console.error("Failed to fetch adjacent conversations:", error);
        setAdjacentConversations({ prevId: null, nextId: null });
      }
    },
    [],
  );

  // 获取对话详情
  const fetchConversation = React.useCallback(
    async (conversationId: number) => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`);
        if (response.ok) {
          const data = (await response.json()) as ConversationWithExtras;
          setCurrentConversation(data);
        }
      } catch (error) {
        console.error("Failed to fetch conversation:", error);
      }
    },
    [],
  );

  // 当选中行时，获取相邻对话并标记为已读
  // 注意：只在首次打开详情时触发，导航时不重复触发
  React.useEffect(() => {
    if (rowAction?.variant === "view") {
      const conversation = rowAction.row.original;
      // 如果已经在查看任何对话（无论ID是否相同），跳过
      // 这防止了导航过程中依赖变化导致的重复触发
      if (viewingConversationIdRef.current !== null) {
        return;
      }
      viewingConversationIdRef.current = conversation.id;
      setCurrentConversation(conversation);
      fetchAdjacentConversations(conversation.id);
      // 自动标记为已读
      if (!isReviewed(conversation.id)) {
        markAsReviewed(conversation.id);
      }
    } else {
      // 关闭详情时重置
      viewingConversationIdRef.current = null;
    }
  }, [rowAction, fetchAdjacentConversations, isReviewed, markAsReviewed]);

  // 导航到相邻对话
  const handleNavigate = React.useCallback(
    async (conversationId: number) => {
      // 递增请求序号，用于处理竞态条件
      const currentRequestId = ++requestIdRef.current;
      // 更新正在查看的对话 ID，防止 effect 重复触发
      viewingConversationIdRef.current = conversationId;

      setIsNavigating(true);
      try {
        await fetchConversation(conversationId);
        // 检查是否仍然是最新请求
        if (currentRequestId !== requestIdRef.current) return;

        await fetchAdjacentConversations(conversationId);
        // 再次检查是否仍然是最新请求
        if (currentRequestId !== requestIdRef.current) return;

        // 导航后标记为已读
        if (!isReviewed(conversationId)) {
          markAsReviewed(conversationId);
        }
      } finally {
        // 只有最新的请求才重置导航状态
        if (currentRequestId === requestIdRef.current) {
          setIsNavigating(false);
        }
      }
    },
    [fetchConversation, fetchAdjacentConversations, isReviewed, markAsReviewed],
  );

  const handlePrevious = React.useCallback(() => {
    if (adjacentConversations.prevId) {
      handleNavigate(adjacentConversations.prevId);
    }
  }, [adjacentConversations.prevId, handleNavigate]);

  const handleNext = React.useCallback(() => {
    if (adjacentConversations.nextId) {
      handleNavigate(adjacentConversations.nextId);
    }
  }, [adjacentConversations.nextId, handleNavigate]);

  const hasPrevious = !!adjacentConversations.prevId && !isNavigating;
  const hasNext = !!adjacentConversations.nextId && !isNavigating;

  return (
    <>
      <DataTable
        table={table}
        actionBar={<ConversationsTableActionBar table={table} />}
      >
        <ConversationsToolbar table={table} />
      </DataTable>
      <TraceDetailSheet
        open={rowAction?.variant === "view"}
        onOpenChange={() => {
          setRowAction(null);
          setCurrentConversation(null);
          setAdjacentConversations({ prevId: null, nextId: null });
        }}
        trace={currentConversation}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        showAddToDataset
      />
      <AddToDatasetDialog
        open={rowAction?.variant === "addToDataset"}
        onOpenChange={() => setRowAction(null)}
        source="trace"
        conversationId={rowAction?.row.original.id ?? 0}
        preview={
          rowAction?.row.original
            ? {
                query: rowAction.row.original.query || "",
              }
            : undefined
        }
      />
    </>
  );
}
