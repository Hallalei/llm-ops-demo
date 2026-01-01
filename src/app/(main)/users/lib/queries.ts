"use cache";

import "server-only";

import { type SQL, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { getConversationsTableRef } from "@/db/utils";

import type { GetUsersSchema } from "./validations";

// 用户聚合数据类型
export interface UserSummary {
  externalId: string;
  totalConversations: number;
  totalSessions: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
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
 * 获取用户列表（从 conversations 表聚合）
 * GROUP BY user_id
 */
export async function getUsers(input: GetUsersSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("users");

  try {
    const offset = (input.page - 1) * input.perPage;
    const { fromDate, toDate } = getDateRangeCondition(input.from, input.to);

    // 构建 WHERE 条件片段
    const whereConditions: SQL[] = [sql`user_id IS NOT NULL`];
    if (input.search) {
      whereConditions.push(sql`user_id ILIKE ${`%${input.search}%`}`);
    }

    const whereClause = sql`WHERE ${sql.join(whereConditions, sql` AND `)}`;

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
    const orderColumn = input.sort[0]?.id ?? "lastSeenAt";
    const orderDesc = input.sort[0]?.desc ?? true;
    const orderDirection = orderDesc ? sql`DESC` : sql`ASC`;

    let orderByColumn: SQL;
    switch (orderColumn) {
      case "totalConversations":
        orderByColumn = sql`"totalConversations"`;
        break;
      case "totalSessions":
        orderByColumn = sql`"totalSessions"`;
        break;
      case "firstSeenAt":
        orderByColumn = sql`"firstSeenAt"`;
        break;
      default:
        orderByColumn = sql`"lastSeenAt"`;
    }

    // 主查询 - 使用原始 SQL
    const tableRef = getConversationsTableRef();
    const dataQuery = sql`
      SELECT
        user_id as "externalId",
        COUNT(*)::int as "totalConversations",
        COUNT(DISTINCT session_id)::int as "totalSessions",
        MIN(created_time) as "firstSeenAt",
        MAX(created_time) as "lastSeenAt"
      FROM ${sql.raw(tableRef)}
      ${whereClause}
      GROUP BY user_id
      ${havingClause}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT ${input.perPage}
      OFFSET ${offset}
    `;

    const data = await db.execute(dataQuery);

    // 获取总数
    const countQuery = sql`
      SELECT COUNT(*) as total FROM (
        SELECT user_id
        FROM ${sql.raw(tableRef)}
        ${whereClause}
        GROUP BY user_id
        ${havingClause}
      ) as user_count
    `;

    const countResult = await db.execute(countQuery);
    const total = Number(countResult[0]?.total ?? 0);

    const pageCount = Math.ceil(total / input.perPage);
    return { data: data as unknown as UserSummary[], pageCount };
  } catch (error) {
    console.error("getUsers error:", error);
    return { data: [], pageCount: 0 };
  }
}

/**
 * 获取单个用户的详细统计信息
 */
export async function getUserStats(externalId: string) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`user-stats-${externalId}`);

  try {
    const tableRef = getConversationsTableRef();
    const result = await db.execute(sql`
      SELECT
        user_id as "externalId",
        COUNT(*)::int as "totalConversations",
        COUNT(DISTINCT session_id)::int as "totalSessions",
        MIN(created_time) as "firstSeenAt",
        MAX(created_time) as "lastSeenAt"
      FROM ${sql.raw(tableRef)}
      WHERE user_id = ${externalId}
      GROUP BY user_id
    `);

    return (result[0] as unknown as UserSummary) ?? null;
  } catch (error) {
    console.error("getUserStats error:", error);
    return null;
  }
}

// 用户对话类型
export interface UserConversation {
  id: number;
  createdTime: string | null;
  sessionId: string | null;
  traceId: string | null;
  env: string | null;
  query: string | null;
  response: string | null;
  latency: string | null;
}

/**
 * 获取指定用户的对话列表
 */
export async function getUserConversations(
  externalId: string,
  limit: number = 20,
): Promise<UserConversation[]> {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`user-conversations-${externalId}`);

  try {
    const tableRef = getConversationsTableRef();
    const result = await db.execute(sql`
      SELECT
        id,
        created_time as "createdTime",
        session_id as "sessionId",
        trace_id as "traceId",
        env,
        query,
        response,
        latency
      FROM ${sql.raw(tableRef)}
      WHERE user_id = ${externalId}
      ORDER BY created_time DESC
      LIMIT ${limit}
    `);

    return result as unknown as UserConversation[];
  } catch (error) {
    console.error("getUserConversations error:", error);
    return [];
  }
}

// 用户会话类型
export interface UserSession {
  sessionId: string;
  messageCount: number;
  firstMessageTime: string | null;
  lastMessageTime: string | null;
}

/**
 * 获取指定用户的会话列表
 */
export async function getUserSessions(
  externalId: string,
  limit: number = 20,
): Promise<UserSession[]> {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`user-sessions-${externalId}`);

  try {
    const tableRef = getConversationsTableRef();
    const result = await db.execute(sql`
      SELECT
        session_id as "sessionId",
        COUNT(*)::int as "messageCount",
        MIN(created_time) as "firstMessageTime",
        MAX(created_time) as "lastMessageTime"
      FROM ${sql.raw(tableRef)}
      WHERE user_id = ${externalId}
      GROUP BY session_id
      ORDER BY MAX(created_time) DESC
      LIMIT ${limit}
    `);

    return result as unknown as UserSession[];
  } catch (error) {
    console.error("getUserSessions error:", error);
    return [];
  }
}
