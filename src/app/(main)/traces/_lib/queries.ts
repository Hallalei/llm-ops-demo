"use cache";

import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import {
  conversationClassifications,
  conversationLanguageDetections,
  conversationReviews,
  conversations,
  conversationTranslations,
} from "@/db/schema";
import { getConversationsTableRef } from "@/db/utils";
import { filterColumns } from "@/lib/data-table/filters";

import type { GetConversationsSchema } from "./validations";

function getDateRangeFilter(
  dateRange: string,
  from?: string | null,
  to?: string | null,
) {
  const now = new Date();

  if (dateRange === "custom" && from && to) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    return and(
      gte(conversations.createdTime, fromDate.toISOString()),
      lte(conversations.createdTime, toDate.toISOString()),
    );
  }

  let startDate: Date | null = null;

  switch (dateRange) {
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      return undefined;
  }

  if (startDate) {
    return gte(conversations.createdTime, startDate.toISOString());
  }

  return undefined;
}

export async function getConversations(input: GetConversationsSchema) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag("conversations");

  try {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable =
      input.filterFlag === "advancedFilters" ||
      input.filterFlag === "commandFilters";

    const advancedWhere = filterColumns({
      table: conversations,
      filters: input.filters,
      joinOperator: input.joinOperator,
    });

    // 日期范围筛选
    const dateRangeFilter = getDateRangeFilter(
      input.dateRange,
      input.from,
      input.to,
    );

    const where = advancedTable
      ? and(advancedWhere, dateRangeFilter)
      : and(
          input.query
            ? ilike(conversations.query, `%${input.query}%`)
            : undefined,
          input.env.length > 0
            ? inArray(conversations.env, input.env)
            : undefined,
          input.tags ? ilike(conversations.tags, `%${input.tags}%`) : undefined,
          input.userId
            ? ilike(conversations.userId, `%${input.userId}%`)
            : undefined,
          input.sessionId
            ? ilike(conversations.sessionId, `%${input.sessionId}%`)
            : undefined,
          dateRangeFilter,
        );

    // 分类筛选条件（单独处理，因为需要 JOIN）
    const categoryFilter =
      input.category && input.category.length > 0
        ? inArray(conversationClassifications.category, input.category)
        : undefined;

    // 质量筛选条件（数据库存储格式为小数如 "0.8"，但可能有非数字值如"无"）
    // 使用正则表达式检查是否为有效数字格式
    const qualityFilter = (() => {
      switch (input.qualityFilter) {
        case "low_fidelity":
          return sql`${conversations.fidelity} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.fidelity} AS DECIMAL) < 0.6`;
        case "low_relevance":
          return sql`${conversations.relevance} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.relevance} AS DECIMAL) < 0.6`;
        case "low_precision":
          return sql`${conversations.precision} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.precision} AS DECIMAL) < 0.6`;
        case "low_any":
          return sql`(
            (${conversations.fidelity} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.fidelity} AS DECIMAL) < 0.6) OR
            (${conversations.relevance} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.relevance} AS DECIMAL) < 0.6) OR
            (${conversations.precision} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.precision} AS DECIMAL) < 0.6) OR
            (${conversations.languageMatch} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.languageMatch} AS DECIMAL) < 0.6)
          )`;
        case "thumbs_down":
          // 用户点踩信息存储在 tags 字段中，包含"踩"字符
          return sql`${conversations.tags} ILIKE '%踩%'`;
        default:
          return undefined;
      }
    })();

    const orderBy =
      input.sort.length > 0
        ? input.sort.map((item) => {
            const column = conversations[item.id as keyof typeof conversations];
            if (
              !column ||
              typeof column === "function" ||
              typeof column === "object"
            )
              return desc(conversations.id);
            return item.desc ? desc(column) : asc(column);
          })
        : [desc(conversations.id)];

    const { data, total } = await db.transaction(async (tx) => {
      // 使用 LEFT JOIN 获取翻译、分类和语种内容
      const query = tx
        .select({
          id: conversations.id,
          createdTime: conversations.createdTime,
          sessionId: conversations.sessionId,
          traceId: conversations.traceId,
          tags: conversations.tags,
          env: conversations.env,
          latency: conversations.latency,
          userId: conversations.userId,
          query: conversations.query,
          response: conversations.response,
          metadata: conversations.metadata,
          scores: conversations.scores,
          precision: conversations.precision,
          relevance: conversations.relevance,
          languageMatch: conversations.languageMatch,
          fidelity: conversations.fidelity,
          queryZh: conversationTranslations.queryZh,
          responseZh: conversationTranslations.responseZh,
          category: conversationClassifications.category,
          confidence: conversationClassifications.confidence,
          detectedLanguage: conversationLanguageDetections.language,
          languageConfidence: conversationLanguageDetections.confidence,
        })
        .from(conversations)
        .leftJoin(
          conversationTranslations,
          sql`${conversations.id} = ${conversationTranslations.conversationId}`,
        )
        .leftJoin(
          conversationClassifications,
          sql`${conversations.id} = ${conversationClassifications.conversationId}`,
        )
        .leftJoin(
          conversationLanguageDetections,
          sql`${conversations.id} = ${conversationLanguageDetections.conversationId}`,
        )
        .limit(input.perPage)
        .offset(offset)
        .orderBy(...orderBy);

      // 组合筛选条件
      const combinedWhere = and(where, categoryFilter, qualityFilter);

      const data = await query.where(combinedWhere);

      // 计算总数
      const total =
        categoryFilter || qualityFilter
          ? await tx
              .select({ count: count() })
              .from(conversations)
              .leftJoin(
                conversationClassifications,
                sql`${conversations.id} = ${conversationClassifications.conversationId}`,
              )
              .where(combinedWhere)
              .execute()
              .then((res) => res[0]?.count ?? 0)
          : await tx
              .select({ count: count() })
              .from(conversations)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

      return { data, total };
    });

    const pageCount = Math.ceil(total / input.perPage);
    return { data, pageCount };
  } catch (error) {
    console.error("Query error:", error);
    return { data: [], pageCount: 0 };
  }
}

export async function getEnvCounts() {
  cacheLife("hours");
  cacheTag("env-counts");

  try {
    return await db
      .select({
        env: conversations.env,
        count: count(),
      })
      .from(conversations)
      .groupBy(conversations.env)
      .having(gt(count(), 0))
      .then((res) =>
        res.reduce(
          (acc, { env, count }) => {
            if (env) acc[env] = count;
            return acc;
          },
          { prod: 0, dev: 0 } as Record<string, number>,
        ),
      );
  } catch {
    return { prod: 0, dev: 0 };
  }
}

/**
 * 获取各分类的计数
 */
export async function getCategoryCounts(
  days?: number,
): Promise<Record<string, number>> {
  cacheLife("hours");
  cacheTag("category-counts");

  try {
    let result: { category: string | null; count: number }[];

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      result = await db
        .select({
          category: conversationClassifications.category,
          count: count(),
        })
        .from(conversationClassifications)
        .innerJoin(
          conversations,
          sql`${conversationClassifications.conversationId} = ${conversations.id}`,
        )
        .where(
          and(
            sql`${conversationClassifications.status} = 'completed'`,
            gte(conversations.createdTime, startDate.toISOString()),
          ),
        )
        .groupBy(conversationClassifications.category);
    } else {
      result = await db
        .select({
          category: conversationClassifications.category,
          count: count(),
        })
        .from(conversationClassifications)
        .where(sql`${conversationClassifications.status} = 'completed'`)
        .groupBy(conversationClassifications.category);
    }

    return result.reduce(
      (acc, { category, count }) => {
        if (category) acc[category] = count;
        return acc;
      },
      {} as Record<string, number>,
    );
  } catch {
    return {};
  }
}

/**
 * 获取各语种的计数
 */
export async function getLanguageCounts(
  days?: number,
): Promise<Record<string, number>> {
  cacheLife("hours");
  cacheTag("language-counts");

  try {
    let result: { language: string | null; count: number }[];

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      result = await db
        .select({
          language: conversationLanguageDetections.language,
          count: count(),
        })
        .from(conversationLanguageDetections)
        .innerJoin(
          conversations,
          sql`${conversationLanguageDetections.conversationId} = ${conversations.id}`,
        )
        .where(
          and(
            sql`${conversationLanguageDetections.status} = 'completed'`,
            gte(conversations.createdTime, startDate.toISOString()),
          ),
        )
        .groupBy(conversationLanguageDetections.language);
    } else {
      result = await db
        .select({
          language: conversationLanguageDetections.language,
          count: count(),
        })
        .from(conversationLanguageDetections)
        .where(sql`${conversationLanguageDetections.status} = 'completed'`)
        .groupBy(conversationLanguageDetections.language);
    }

    return result.reduce(
      (acc, { language, count }) => {
        if (language) acc[language] = count;
        return acc;
      },
      {} as Record<string, number>,
    );
  } catch {
    return {};
  }
}

/**
 * 获取相邻对话（上一个/下一个）
 * 基于 id DESC 排序（与列表默认排序一致）
 * @deprecated 使用 getAdjacentConversationsWithFilters 代替
 */
export async function getAdjacentConversations(
  currentId: number,
): Promise<{ prevId: number | null; nextId: number | null }> {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`adjacent-conversations-${currentId}`);

  try {
    const tableRef = getConversationsTableRef();
    const result = await db.execute(sql`
      SELECT
        (SELECT id FROM ${sql.raw(tableRef)}
         WHERE id > ${currentId}
         ORDER BY id ASC LIMIT 1) as "prevId",
        (SELECT id FROM ${sql.raw(tableRef)}
         WHERE id < ${currentId}
         ORDER BY id DESC LIMIT 1) as "nextId"
    `);

    return {
      prevId: result[0]?.prevId ? Number(result[0].prevId) : null,
      nextId: result[0]?.nextId ? Number(result[0].nextId) : null,
    };
  } catch (error) {
    console.error("getAdjacentConversations error:", error);
    return { prevId: null, nextId: null };
  }
}

/**
 * 构建筛选条件（复用逻辑）
 */
function buildFilterConditions(input: Partial<GetConversationsSchema>) {
  const advancedTable =
    input.filterFlag === "advancedFilters" ||
    input.filterFlag === "commandFilters";

  const advancedWhere = input.filters
    ? filterColumns({
        table: conversations,
        filters: input.filters,
        joinOperator: input.joinOperator || "and",
      })
    : undefined;

  const dateRangeFilter = getDateRangeFilter(
    input.dateRange || "all",
    input.from,
    input.to,
  );

  const baseWhere = advancedTable
    ? and(advancedWhere, dateRangeFilter)
    : and(
        input.query
          ? ilike(conversations.query, `%${input.query}%`)
          : undefined,
        input.env && input.env.length > 0
          ? inArray(conversations.env, input.env)
          : undefined,
        input.tags ? ilike(conversations.tags, `%${input.tags}%`) : undefined,
        input.userId
          ? ilike(conversations.userId, `%${input.userId}%`)
          : undefined,
        input.sessionId
          ? ilike(conversations.sessionId, `%${input.sessionId}%`)
          : undefined,
        dateRangeFilter,
      );

  const categoryFilter =
    input.category && input.category.length > 0
      ? inArray(conversationClassifications.category, input.category)
      : undefined;

  // 质量筛选条件（数据库存储格式为小数如 "0.8"，但可能有非数字值如"无"）
  // 使用正则表达式检查是否为有效数字格式
  const qualityFilter = (() => {
    switch (input.qualityFilter) {
      case "low_fidelity":
        return sql`${conversations.fidelity} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.fidelity} AS DECIMAL) < 0.6`;
      case "low_relevance":
        return sql`${conversations.relevance} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.relevance} AS DECIMAL) < 0.6`;
      case "low_precision":
        return sql`${conversations.precision} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.precision} AS DECIMAL) < 0.6`;
      case "low_any":
        return sql`(
          (${conversations.fidelity} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.fidelity} AS DECIMAL) < 0.6) OR
          (${conversations.relevance} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.relevance} AS DECIMAL) < 0.6) OR
          (${conversations.precision} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.precision} AS DECIMAL) < 0.6) OR
          (${conversations.languageMatch} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST(${conversations.languageMatch} AS DECIMAL) < 0.6)
        )`;
      case "thumbs_down":
        // 用户点踩信息存储在 tags 字段中，包含"踩"字符
        return sql`${conversations.tags} ILIKE '%踩%'`;
      default:
        return undefined;
    }
  })();

  return {
    baseWhere,
    categoryFilter,
    qualityFilter,
    needsJoin: !!(categoryFilter || qualityFilter),
  };
}

/**
 * 获取相邻对话（上一个/下一个）- 支持筛选条件
 * 根据当前筛选条件和排序方式查找上一条/下一条
 */
export async function getAdjacentConversationsWithFilters(
  currentId: number,
  filters: Partial<GetConversationsSchema>,
): Promise<{ prevId: number | null; nextId: number | null }> {
  try {
    const { baseWhere, categoryFilter, qualityFilter, needsJoin } =
      buildFilterConditions(filters);
    const combinedWhere = and(baseWhere, categoryFilter, qualityFilter);

    // 获取排序配置，默认 id DESC
    const sortConfig =
      filters.sort && filters.sort.length > 0
        ? filters.sort[0]
        : { id: "id" as const, desc: true };

    const sortColumn = (sortConfig?.id || "id") as keyof typeof conversations;
    const isDescending = sortConfig?.desc ?? true;

    // 构建基础查询
    const buildQuery = (direction: "prev" | "next") => {
      // 对于 DESC 排序：prev = 值更大的, next = 值更小的
      // 对于 ASC 排序：prev = 值更小的, next = 值更大的
      const isPrev = direction === "prev";
      const compareOp = isDescending ? (isPrev ? gt : lt) : isPrev ? lt : gt;
      const orderDirection = isDescending
        ? isPrev
          ? asc
          : desc
        : isPrev
          ? desc
          : asc;

      const baseQuery = db.select({ id: conversations.id }).from(conversations);

      if (needsJoin) {
        baseQuery.leftJoin(
          conversationClassifications,
          sql`${conversations.id} = ${conversationClassifications.conversationId}`,
        );
      }

      const column = conversations[sortColumn];
      if (
        !column ||
        typeof column === "function" ||
        typeof column === "object"
      ) {
        // 回退到 id
        return baseQuery
          .where(and(combinedWhere, compareOp(conversations.id, currentId)))
          .orderBy(orderDirection(conversations.id))
          .limit(1);
      }

      return baseQuery
        .where(and(combinedWhere, compareOp(conversations.id, currentId)))
        .orderBy(orderDirection(conversations.id))
        .limit(1);
    };

    const [prevResult, nextResult] = await Promise.all([
      buildQuery("prev"),
      buildQuery("next"),
    ]);

    return {
      prevId: prevResult[0]?.id ?? null,
      nextId: nextResult[0]?.id ?? null,
    };
  } catch (error) {
    console.error("getAdjacentConversationsWithFilters error:", error);
    return { prevId: null, nextId: null };
  }
}

/**
 * 获取单条对话详情（包含翻译和分类）
 */
export async function getConversationById(id: number) {
  cacheLife({ revalidate: 1, stale: 1, expire: 60 });
  cacheTag(`conversation-${id}`);

  try {
    const result = await db
      .select({
        id: conversations.id,
        createdTime: conversations.createdTime,
        sessionId: conversations.sessionId,
        traceId: conversations.traceId,
        tags: conversations.tags,
        env: conversations.env,
        latency: conversations.latency,
        userId: conversations.userId,
        query: conversations.query,
        response: conversations.response,
        metadata: conversations.metadata,
        scores: conversations.scores,
        precision: conversations.precision,
        relevance: conversations.relevance,
        languageMatch: conversations.languageMatch,
        fidelity: conversations.fidelity,
        queryZh: conversationTranslations.queryZh,
        responseZh: conversationTranslations.responseZh,
        category: conversationClassifications.category,
        confidence: conversationClassifications.confidence,
        detectedLanguage: conversationLanguageDetections.language,
        languageConfidence: conversationLanguageDetections.confidence,
      })
      .from(conversations)
      .leftJoin(
        conversationTranslations,
        sql`${conversations.id} = ${conversationTranslations.conversationId}`,
      )
      .leftJoin(
        conversationClassifications,
        sql`${conversations.id} = ${conversationClassifications.conversationId}`,
      )
      .leftJoin(
        conversationLanguageDetections,
        sql`${conversations.id} = ${conversationLanguageDetections.conversationId}`,
      )
      .where(sql`${conversations.id} = ${id}`)
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("getConversationById error:", error);
    return null;
  }
}

export type ConversationDetail = Awaited<
  ReturnType<typeof getConversationById>
>;

// 扩展的 Conversation 类型（包含翻译、分类和语种检测字段）
export type ConversationWithExtras = NonNullable<
  Awaited<ReturnType<typeof getConversations>>["data"][number]
>;
