import { NextResponse } from "next/server";
import {
  getAdjacentConversations,
  getAdjacentConversationsWithFilters,
} from "@/app/(main)/traces/_lib/queries";
import type { GetConversationsSchema } from "@/app/(main)/traces/_lib/validations";
import { withRoles } from "@/lib/auth/api-guards";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 解析 URL 查询参数为筛选条件
 */
function parseFiltersFromSearchParams(
  searchParams: URLSearchParams,
): Partial<GetConversationsSchema> {
  const filters: Partial<GetConversationsSchema> = {};

  // 基础筛选
  const query = searchParams.get("query");
  if (query) filters.query = query;

  const env = searchParams.getAll("env");
  if (env.length > 0) filters.env = env as ("prod" | "dev")[];

  const tags = searchParams.get("tags");
  if (tags) filters.tags = tags;

  const userId = searchParams.get("userId");
  if (userId) filters.userId = userId;

  const sessionId = searchParams.get("sessionId");
  if (sessionId) filters.sessionId = sessionId;

  // 意图分类
  const category = searchParams.getAll("category");
  if (category.length > 0) filters.category = category;

  // 日期范围
  const dateRange = searchParams.get("dateRange");
  if (dateRange) {
    filters.dateRange = dateRange as GetConversationsSchema["dateRange"];
  }

  const from = searchParams.get("from");
  if (from) filters.from = from;

  const to = searchParams.get("to");
  if (to) filters.to = to;

  // 质量筛选
  const qualityFilter = searchParams.get("qualityFilter");
  if (qualityFilter) {
    filters.qualityFilter =
      qualityFilter as GetConversationsSchema["qualityFilter"];
  }

  // 排序
  const sort = searchParams.get("sort");
  if (sort) {
    try {
      const parsed = JSON.parse(sort);
      if (Array.isArray(parsed)) {
        filters.sort = parsed as GetConversationsSchema["sort"];
      }
    } catch {
      // 尝试解析简单格式 "id:desc"
      const [id, direction] = sort.split(":");
      if (id) {
        filters.sort = [{ id: id as "id", desc: direction === "desc" }];
      }
    }
  }

  return filters;
}

/**
 * 获取相邻对话 ID
 * GET /api/conversations/:id/adjacent
 * 支持查询参数传递筛选条件
 */
const adminRoles = ["admin", "superadmin"] as const;

export const GET = withRoles(
  adminRoles,
  async (request: Request, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const conversationId = Number(id);

      if (Number.isNaN(conversationId)) {
        return NextResponse.json(
          { error: "Invalid conversation ID" },
          { status: 400 },
        );
      }

      const { searchParams } = new URL(request.url);
      const hasFilters = searchParams.toString().length > 0;

      // 如果有筛选参数，使用带筛选的查询；否则使用简单查询
      const result = hasFilters
        ? await getAdjacentConversationsWithFilters(
            conversationId,
            parseFiltersFromSearchParams(searchParams),
          )
        : await getAdjacentConversations(conversationId);

      return NextResponse.json(result);
    } catch (error) {
      console.error("Failed to fetch adjacent conversations:", error);
      return NextResponse.json(
        { error: "Failed to fetch adjacent conversations" },
        { status: 500 },
      );
    }
  },
);
