"use cache";

import "server-only";

import { asc, count, desc, eq, max, min, type SQL, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { conversations, conversationTranslations } from "@/db/schema";
import { getConversationsTableRef } from "@/db/utils";

import type { GetSessionsSchema } from "./validations";

// Session 聚合数据类型
export interface SessionSummary {
  sessionId: string;
  userId: string | null;
  env: string | null;
  messageCount: number;
  firstMessageTime: string | null;
  lastMessageTime: string | null;
}

/**
 * 根据 from/to 参数构建时间筛选条件
 */
function getDateRangeCondition(
  from?: string | null,
  to?: string | null,
): { fromDate: Date | null; toDate: Date | null } {
  if (!from && !to) {
    return { fromDate: null, toDate: null };
  }

  let fromDate: Date | null = null;
  let toDate: Date | null = null;

  if (from) {
    fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
  }

  if (to) {
    toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
  }

  return { fromDate, toDate };
}

/**
 * 获取 Session 列表（从 conversations 表聚合）
 * GROUP BY sessionId, userId, env
 * 使用原始 SQL 查询以支持复杂的聚合和过滤
 */
export async function getSessions(input: GetSessionsSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("sessions");

  try {
    const offset = (input.page - 1) * input.perPage;
    const { fromDate, toDate } = getDateRangeCondition(input.from, input.to);

    // 构建 WHERE 条件片段
    const whereConditions: SQL[] = [];
    if (input.sessionId) {
      whereConditions.push(sql`session_id ILIKE ${`%${input.sessionId}%`}`);
    }
    if (input.userId) {
      whereConditions.push(sql`user_id ILIKE ${`%${input.userId}%`}`);
    }
    if (input.env) {
      whereConditions.push(sql`env = ${input.env}`);
    }

    const whereClause =
      whereConditions.length > 0
        ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
        : sql``;

    // 构建 HAVING 条件（时间筛选）
    const havingConditions: SQL[] = [];
    if (fromDate) {
      havingConditions.push(
        sql`MAX(created_time) >= ${fromDate.toISOString()}`,
      );
    }
    if (toDate) {
      havingConditions.push(sql`MAX(created_time) <= ${toDate.toISOString()}`);
    }

    const havingClause =
      havingConditions.length > 0
        ? sql`HAVING ${sql.join(havingConditions, sql` AND `)}`
        : sql``;

    // 构建 ORDER BY
    const orderColumn = input.sort[0]?.id ?? "lastMessageTime";
    const orderDesc = input.sort[0]?.desc ?? true;
    const orderDirection = orderDesc ? sql`DESC` : sql`ASC`;

    let orderByColumn: SQL;
    switch (orderColumn) {
      case "messageCount":
        orderByColumn = sql`"messageCount"`;
        break;
      case "firstMessageTime":
        orderByColumn = sql`"firstMessageTime"`;
        break;
      default:
        orderByColumn = sql`"lastMessageTime"`;
    }

    // 主查询 - 使用原始 SQL
    const tableRef = getConversationsTableRef();
    const dataQuery = sql`
      SELECT
        session_id as "sessionId",
        user_id as "userId",
        env,
        COUNT(id)::int as "messageCount",
        MIN(created_time) as "firstMessageTime",
        MAX(created_time) as "lastMessageTime"
      FROM ${sql.raw(tableRef)}
      ${whereClause}
      GROUP BY session_id, user_id, env
      ${havingClause}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT ${input.perPage}
      OFFSET ${offset}
    `;

    const data = await db.execute(dataQuery);

    // 获取总数
    const countQuery = sql`
      SELECT COUNT(*) as total FROM (
        SELECT session_id
        FROM ${sql.raw(tableRef)}
        ${whereClause}
        GROUP BY session_id, user_id, env
        ${havingClause}
      ) as session_count
    `;

    const countResult = await db.execute(countQuery);
    const total = Number(countResult[0]?.total ?? 0);

    const pageCount = Math.ceil(total / input.perPage);
    return { data: data as unknown as SessionSummary[], pageCount };
  } catch (error) {
    console.error("getSessions error:", error);
    return { data: [], pageCount: 0 };
  }
}

// Session 对话类型（包含翻译和评分）
export interface SessionConversation {
  id: number;
  createdTime: string | null;
  traceId: string | null;
  userId: string | null;
  env: string | null;
  query: string | null;
  response: string | null;
  queryZh: string | null;
  responseZh: string | null;
  latency: string | null;
  metadata: Record<string, unknown> | null;
  scores: Record<string, unknown> | null;
  tag: string | null;
  precision: string | null;
  relevance: string | null;
  languageMatch: string | null;
  fidelity: string | null;
}

/**
 * 获取指定 Session 的所有对话
 * 按 createdTime ASC 排序（时间线顺序）
 */
export async function getSessionConversations(
  sessionId: string,
): Promise<SessionConversation[]> {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`session-${sessionId}`);

  try {
    const data = await db
      .select({
        id: conversations.id,
        createdTime: conversations.createdTime,
        traceId: conversations.traceId,
        userId: conversations.userId,
        env: conversations.env,
        query: conversations.query,
        response: conversations.response,
        queryZh: conversationTranslations.queryZh,
        responseZh: conversationTranslations.responseZh,
        latency: conversations.latency,
        metadata: conversations.metadata,
        scores: conversations.scores,
        tag: conversations.tag,
        precision: conversations.precision,
        relevance: conversations.relevance,
        languageMatch: conversations.languageMatch,
        fidelity: conversations.fidelity,
      })
      .from(conversations)
      .leftJoin(
        conversationTranslations,
        sql`${conversations.id} = ${conversationTranslations.conversationId}`,
      )
      .where(eq(conversations.sessionId, sessionId))
      .orderBy(asc(conversations.createdTime));

    return data as SessionConversation[];
  } catch (error) {
    console.error("getSessionConversations error:", error);
    return [];
  }
}

/**
 * 获取 Session 基本信息
 */
export async function getSessionInfo(sessionId: string) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`session-info-${sessionId}`);

  try {
    const result = await db
      .select({
        sessionId: conversations.sessionId,
        userId: conversations.userId,
        env: conversations.env,
        messageCount: count(conversations.id),
        firstMessageTime: min(conversations.createdTime),
        lastMessageTime: max(conversations.createdTime),
      })
      .from(conversations)
      .where(eq(conversations.sessionId, sessionId))
      .groupBy(
        conversations.sessionId,
        conversations.userId,
        conversations.env,
      );

    return result[0] ?? null;
  } catch (error) {
    console.error("getSessionInfo error:", error);
    return null;
  }
}

/**
 * 获取相邻会话（上一个/下一个）
 * 基于 lastMessageTime DESC 排序（与列表默认排序一致）
 * 使用原始 SQL 查询避免 drizzle-orm 子查询问题
 */
export async function getAdjacentSessions(
  currentSessionId: string,
): Promise<{ prevSessionId: string | null; nextSessionId: string | null }> {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`adjacent-sessions-${currentSessionId}`);

  try {
    const tableRef = getConversationsTableRef();
    // 先获取当前会话的最后消息时间
    const currentResult = await db.execute(sql`
      SELECT MAX(created_time) as last_time
      FROM ${sql.raw(tableRef)}
      WHERE session_id = ${currentSessionId}
    `);

    const currentTime = currentResult[0]?.last_time as string | null;
    if (!currentTime) {
      return { prevSessionId: null, nextSessionId: null };
    }

    // 分别查询上一个和下一个会话
    const [prevResult, nextResult] = await Promise.all([
      // 上一个：时间更大（更新）的会话中最接近的一个
      db.execute(sql`
        SELECT session_id
        FROM ${sql.raw(tableRef)}
        GROUP BY session_id
        HAVING MAX(created_time) > ${currentTime}
        ORDER BY MAX(created_time) ASC
        LIMIT 1
      `),
      // 下一个：时间更小（更旧）的会话中最接近的一个
      db.execute(sql`
        SELECT session_id
        FROM ${sql.raw(tableRef)}
        GROUP BY session_id
        HAVING MAX(created_time) < ${currentTime}
        ORDER BY MAX(created_time) DESC
        LIMIT 1
      `),
    ]);

    return {
      prevSessionId: (prevResult[0]?.session_id as string) ?? null,
      nextSessionId: (nextResult[0]?.session_id as string) ?? null,
    };
  } catch (error) {
    console.error("getAdjacentSessions error:", error);
    return { prevSessionId: null, nextSessionId: null };
  }
}
