"use cache";

import "server-only";

import { and, count, gte, lte, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { conversationClassifications, conversations } from "@/db/schema";
import { getDateRangeFromPreset } from "@/lib/core/date-range";

/**
 * 日期范围参数类型
 */
export interface DateRangeParams {
  from?: string | null;
  to?: string | null;
}

/**
 * 生成日期范围条件
 * @param from 开始日期 (yyyy-MM-dd)
 * @param to 结束日期 (yyyy-MM-dd)
 */
function getDateRangeFilter(from?: string | null, to?: string | null) {
  if (!from && !to) return undefined;

  const conditions = [];

  if (from) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    conditions.push(gte(conversations.createdTime, fromDate.toISOString()));
  }

  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(conversations.createdTime, toDate.toISOString()));
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

/**
 * 根据 from/to 计算天数差（用于环比计算）
 */
function getDaysFromRange(from?: string | null, to?: string | null): number {
  if (!from || !to) return 7; // 默认 7 天

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 7;
}

/**
 * 核心统计指标
 */
export async function getDashboardStats({ from, to }: DateRangeParams = {}) {
  cacheLife({ revalidate: 60, stale: 30 });
  cacheTag("dashboard-stats");

  try {
    const dateFilter = getDateRangeFilter(from, to);

    const result = await db
      .select({
        totalCount: count(),
        todayCount: sql<number>`COUNT(*) FILTER (WHERE DATE(${conversations.createdTime}) = CURRENT_DATE)`,
        uniqueUsers: sql<number>`COUNT(DISTINCT ${conversations.userId})`,
        uniqueSessions: sql<number>`COUNT(DISTINCT ${conversations.sessionId})`,
      })
      .from(conversations)
      .where(dateFilter);

    return {
      totalCount: result[0]?.totalCount ?? 0,
      todayCount: Number(result[0]?.todayCount ?? 0),
      uniqueUsers: Number(result[0]?.uniqueUsers ?? 0),
      uniqueSessions: Number(result[0]?.uniqueSessions ?? 0),
    };
  } catch (error) {
    console.error("获取仪表盘统计数据失败:", error);
    return {
      totalCount: 0,
      todayCount: 0,
      uniqueUsers: 0,
      uniqueSessions: 0,
    };
  }
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

/**
 * 带环比对比的统计指标（根据时间范围动态调整）
 */
export async function getDashboardStatsWithComparison({
  from,
  to,
}: DateRangeParams = {}) {
  cacheLife({ revalidate: 60, stale: 30 });
  cacheTag("dashboard-stats-comparison");

  try {
    const now = new Date();
    const days = getDaysFromRange(from, to);

    // 没有日期参数表示全部数据，此时不做环比对比
    const isAll = !from && !to;

    const currentStart = new Date(now);
    if (!isAll) {
      currentStart.setDate(currentStart.getDate() - days);
    } else {
      // 全部数据时，设置一个很早的日期
      currentStart.setFullYear(2000);
    }

    const previousStart = new Date(currentStart);
    if (!isAll) {
      previousStart.setDate(previousStart.getDate() - days);
    }

    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    // 当前周期基础数据
    const currentResult = await db
      .select({
        totalCount: count(),
        uniqueUsers: sql<number>`COUNT(DISTINCT ${conversations.userId})`,
        uniqueSessions: sql<number>`COUNT(DISTINCT ${conversations.sessionId})`,
      })
      .from(conversations)
      .where(
        isAll
          ? undefined
          : gte(conversations.createdTime, currentStart.toISOString()),
      );

    // 上一周期基础数据（全部数据时跳过）
    const previousResult = isAll
      ? [{ totalCount: 0, uniqueUsers: 0, uniqueSessions: 0 }]
      : await db
          .select({
            totalCount: count(),
            uniqueUsers: sql<number>`COUNT(DISTINCT ${conversations.userId})`,
            uniqueSessions: sql<number>`COUNT(DISTINCT ${conversations.sessionId})`,
          })
          .from(conversations)
          .where(
            and(
              gte(conversations.createdTime, previousStart.toISOString()),
              sql`${conversations.createdTime} < ${currentStart.toISOString()}`,
            ),
          );

    const current = {
      totalCount: currentResult[0]?.totalCount ?? 0,
      uniqueUsers: Number(currentResult[0]?.uniqueUsers ?? 0),
      uniqueSessions: Number(currentResult[0]?.uniqueSessions ?? 0),
    };

    const previous = {
      totalCount: previousResult[0]?.totalCount ?? 0,
      uniqueUsers: Number(previousResult[0]?.uniqueUsers ?? 0),
      uniqueSessions: Number(previousResult[0]?.uniqueSessions ?? 0),
    };

    // 根据时间范围计算第二个指标
    let secondMetric: { current: number; previous: number; change: number };
    let secondMetricType: "todayCount" | "hourlyPeak" | "dailyAvg";

    if (days === 1) {
      // 近24小时：小时峰值
      secondMetricType = "hourlyPeak";
      const hourlyResult = await db.execute<{ hour: number; cnt: number }>(sql`
        SELECT EXTRACT(HOUR FROM (${conversations.createdTime})::timestamp) as hour, COUNT(*)::int as cnt
        FROM ${conversations}
        WHERE (${conversations.createdTime})::timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY cnt DESC
        LIMIT 1
      `);

      const prevHourlyResult = await db.execute<{
        hour: number;
        cnt: number;
      }>(sql`
        SELECT EXTRACT(HOUR FROM (${conversations.createdTime})::timestamp) as hour, COUNT(*)::int as cnt
        FROM ${conversations}
        WHERE (${conversations.createdTime})::timestamp >= NOW() - INTERVAL '48 hours'
          AND (${conversations.createdTime})::timestamp < NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY cnt DESC
        LIMIT 1
      `);

      const currentPeak = Number(hourlyResult[0]?.cnt ?? 0);
      const previousPeak = Number(prevHourlyResult[0]?.cnt ?? 0);
      secondMetric = {
        current: currentPeak,
        previous: previousPeak,
        change: calcChange(currentPeak, previousPeak),
      };
    } else if (days >= 30 && !isAll) {
      // 近30天及以上：日均对话
      secondMetricType = "dailyAvg";
      const currentDailyAvg = Math.round(current.totalCount / days);
      const previousDailyAvg = Math.round(previous.totalCount / days);
      secondMetric = {
        current: currentDailyAvg,
        previous: previousDailyAvg,
        change: calcChange(currentDailyAvg, previousDailyAvg),
      };
    } else {
      // 近7天或全部：今日新增
      secondMetricType = "todayCount";
      const todayResult = await db
        .select({ count: count() })
        .from(conversations)
        .where(sql`DATE(${conversations.createdTime}) = CURRENT_DATE`);

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const yesterdayResult = await db
        .select({ count: count() })
        .from(conversations)
        .where(
          and(
            gte(conversations.createdTime, yesterdayStart.toISOString()),
            sql`${conversations.createdTime} <= ${yesterdayEnd.toISOString()}`,
          ),
        );

      const todayCount = todayResult[0]?.count ?? 0;
      const yesterdayCount = yesterdayResult[0]?.count ?? 0;
      secondMetric = {
        current: todayCount,
        previous: yesterdayCount,
        change: calcChange(todayCount, yesterdayCount),
      };
    }

    return {
      days,
      secondMetricType,
      totalCount: {
        current: current.totalCount,
        previous: previous.totalCount,
        change: calcChange(current.totalCount, previous.totalCount),
      },
      secondMetric,
      uniqueUsers: {
        current: current.uniqueUsers,
        previous: previous.uniqueUsers,
        change: calcChange(current.uniqueUsers, previous.uniqueUsers),
      },
      uniqueSessions: {
        current: current.uniqueSessions,
        previous: previous.uniqueSessions,
        change: calcChange(current.uniqueSessions, previous.uniqueSessions),
      },
    };
  } catch (error) {
    console.error("获取仪表盘对比统计数据失败:", error);
    const errorDays = getDaysFromRange(from, to);
    return {
      days: errorDays,
      secondMetricType: "todayCount" as const,
      totalCount: { current: 0, previous: 0, change: 0 },
      secondMetric: { current: 0, previous: 0, change: 0 },
      uniqueUsers: { current: 0, previous: 0, change: 0 },
      uniqueSessions: { current: 0, previous: 0, change: 0 },
    };
  }
}

export type DashboardStatsWithComparison = Awaited<
  ReturnType<typeof getDashboardStatsWithComparison>
>;

/**
 * 获取周期标签文本
 */
function getPeriodLabel(days: number): string {
  if (days === 1) return "近24h";
  if (days === 7) return "近7天";
  if (days === 30) return "近30天";
  if (days === 0) return "全部";
  return `近${days}天`;
}

/**
 * 累计指标 + 动态趋势统计
 * - 累计数：历史总量（不受时间范围影响）
 * - 周期增量：根据选择的时间范围计算新增数
 * - 近24h对话：滚动24小时统计，环比前24小时
 */
export async function getFixedStatsWithTrend({
  from,
  to,
}: DateRangeParams = {}) {
  cacheLife({ revalidate: 60, stale: 30 });
  cacheTag("fixed-stats-trend");

  const days = getDaysFromRange(from, to);
  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  try {
    // 1. 累计总量（全量统计）
    const totalResult = await db
      .select({
        totalCount: count(),
        uniqueUsers: sql<number>`COUNT(DISTINCT ${conversations.userId})`,
        uniqueSessions: sql<number>`COUNT(DISTINCT ${conversations.sessionId})`,
      })
      .from(conversations);

    const totals = {
      totalCount: totalResult[0]?.totalCount ?? 0,
      uniqueUsers: Number(totalResult[0]?.uniqueUsers ?? 0),
      uniqueSessions: Number(totalResult[0]?.uniqueSessions ?? 0),
    };

    // 2. 本周期增量（根据时间范围）
    const effectiveDays = days === 0 ? 30 : days;
    const periodResult = await db.execute<{
      count: number;
      users: number;
      sessions: number;
    }>(sql`
      SELECT 
        COUNT(*)::int as count,
        COUNT(DISTINCT ${conversations.userId})::int as users,
        COUNT(DISTINCT ${conversations.sessionId})::int as sessions
      FROM ${conversations}
      WHERE (${conversations.createdTime})::timestamp >= NOW() - INTERVAL '${sql.raw(String(effectiveDays))} days'
    `);

    const periodIncrement = {
      count: Number(periodResult[0]?.count ?? 0),
      users: Number(periodResult[0]?.users ?? 0),
      sessions: Number(periodResult[0]?.sessions ?? 0),
    };

    // 2.1 上周期增量（用于计算环比）
    const prevPeriodResult = await db.execute<{
      count: number;
      users: number;
      sessions: number;
    }>(sql`
      SELECT 
        COUNT(*)::int as count,
        COUNT(DISTINCT ${conversations.userId})::int as users,
        COUNT(DISTINCT ${conversations.sessionId})::int as sessions
      FROM ${conversations}
      WHERE (${conversations.createdTime})::timestamp >= NOW() - INTERVAL '${sql.raw(String(effectiveDays * 2))} days'
        AND (${conversations.createdTime})::timestamp < NOW() - INTERVAL '${sql.raw(String(effectiveDays))} days'
    `);

    const prevPeriodIncrement = {
      count: Number(prevPeriodResult[0]?.count ?? 0),
      users: Number(prevPeriodResult[0]?.users ?? 0),
      sessions: Number(prevPeriodResult[0]?.sessions ?? 0),
    };

    // 3. 近24小时对话 + 环比前24小时
    const last24hResult = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int as count
      FROM ${conversations}
      WHERE (${conversations.createdTime})::timestamp >= NOW() - INTERVAL '24 hours'
    `);

    const prev24hResult = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int as count
      FROM ${conversations}
      WHERE (${conversations.createdTime})::timestamp >= NOW() - INTERVAL '48 hours'
        AND (${conversations.createdTime})::timestamp < NOW() - INTERVAL '24 hours'
    `);

    const last24h = Number(last24hResult[0]?.count ?? 0);
    const prev24h = Number(prev24hResult[0]?.count ?? 0);

    return {
      periodLabel: getPeriodLabel(days),
      totalCount: {
        total: totals.totalCount,
        periodIncrement: periodIncrement.count,
        change: calcChange(periodIncrement.count, prevPeriodIncrement.count),
      },
      uniqueUsers: {
        total: totals.uniqueUsers,
        periodIncrement: periodIncrement.users,
        change: calcChange(periodIncrement.users, prevPeriodIncrement.users),
      },
      uniqueSessions: {
        total: totals.uniqueSessions,
        periodIncrement: periodIncrement.sessions,
        change: calcChange(
          periodIncrement.sessions,
          prevPeriodIncrement.sessions,
        ),
      },
      last24h: {
        current: last24h,
        previous: prev24h,
        change: calcChange(last24h, prev24h),
      },
    };
  } catch (error) {
    console.error("获取累计统计数据失败:", error);
    return {
      periodLabel: getPeriodLabel(days),
      totalCount: { total: 0, periodIncrement: 0, change: 0 },
      uniqueUsers: { total: 0, periodIncrement: 0, change: 0 },
      uniqueSessions: { total: 0, periodIncrement: 0, change: 0 },
      last24h: { current: 0, previous: 0, change: 0 },
    };
  }
}

export type FixedStatsWithTrend = Awaited<
  ReturnType<typeof getFixedStatsWithTrend>
>;

/**
 * 每日趋势数据
 */
export async function getDailyTrend({ from, to }: DateRangeParams = {}) {
  cacheLife({ revalidate: 300, stale: 60 });
  cacheTag("daily-trend");

  try {
    // 没有日期参数时显示全部数据
    const isAll = !from && !to;

    let result: {
      date: string;
      total: number;
      prod_count: number;
      dev_count: number;
    }[];

    if (isAll) {
      // 全部数据：不加时间过滤
      result = await db.execute<{
        date: string;
        total: number;
        prod_count: number;
        dev_count: number;
      }>(sql`
        SELECT
          DATE((${conversations.createdTime})::timestamp) as date,
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE ${conversations.env} = 'prod')::int as prod_count,
          COUNT(*) FILTER (WHERE ${conversations.env} = 'dev')::int as dev_count
        FROM ${conversations}
        GROUP BY DATE((${conversations.createdTime})::timestamp)
        ORDER BY date ASC
      `);
    } else {
      const days = getDaysFromRange(from, to);
      result = await db.execute<{
        date: string;
        total: number;
        prod_count: number;
        dev_count: number;
      }>(sql`
        SELECT
          DATE((${conversations.createdTime})::timestamp) as date,
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE ${conversations.env} = 'prod')::int as prod_count,
          COUNT(*) FILTER (WHERE ${conversations.env} = 'dev')::int as dev_count
        FROM ${conversations}
        WHERE (${conversations.createdTime})::timestamp::date >= CURRENT_DATE - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY DATE((${conversations.createdTime})::timestamp)
        ORDER BY date ASC
      `);
    }

    return result.map((row) => ({
      date: String(row.date),
      total: Number(row.total),
      prodCount: Number(row.prod_count),
      devCount: Number(row.dev_count),
    }));
  } catch (error) {
    console.error("获取每日趋势数据失败:", error);
    return [];
  }
}

export type DailyTrendItem = {
  date: string;
  total: number;
  prodCount: number;
  devCount: number;
};

/**
 * 获取 Tag 多维度分布统计
 * 解析 Tag 字段，提取：平台、页面入口、用户反馈、异常统计
 */
export async function getTagDimensionStats({ from, to }: DateRangeParams = {}) {
  cacheLife({ revalidate: 300, stale: 60 });
  cacheTag("tag-dimension-stats");

  const KNOWN_PAGES = [
    "stationDetailPage",
    "stationListPage",
    "supportCenterPage",
    "copilotPage",
    "LivePricePage",
    "plantListSearchPage",
    "PlantControlModeSettingPage",
  ];

  try {
    const dateFilter = getDateRangeFilter(from, to);

    const result = await db
      .select({
        tag: conversations.tags,
        count: count(),
      })
      .from(conversations)
      .where(dateFilter)
      .groupBy(conversations.tags);

    const stats = {
      platform: { App: 0, Web: 0, Other: 0 },
      pageEntry: {} as Record<string, number>,
      feedback: { like: 0, dislike: 0 },
      issues: { noKnowledge: 0, emptyReply: 0 },
    };

    for (const row of result) {
      const tag = row.tag || "";
      const parts = tag.split(",").map((p) => p.trim());
      const cnt = row.count;

      // 平台分布
      if (parts.includes("App")) {
        stats.platform.App += cnt;
      } else if (parts.includes("Web")) {
        stats.platform.Web += cnt;
      } else {
        stats.platform.Other += cnt;
      }

      // 页面入口
      for (const page of KNOWN_PAGES) {
        if (parts.includes(page)) {
          stats.pageEntry[page] = (stats.pageEntry[page] || 0) + cnt;
          break;
        }
      }

      // 用户反馈
      if (parts.includes("赞")) {
        stats.feedback.like += cnt;
      }
      if (parts.includes("踩")) {
        stats.feedback.dislike += cnt;
      }

      // 异常统计
      if (parts.includes("NO_KNOWLEDGE")) {
        stats.issues.noKnowledge += cnt;
      }
      if (parts.includes("None")) {
        stats.issues.emptyReply += cnt;
      }
    }

    return stats;
  } catch (error) {
    console.error("获取 Tag 维度统计失败:", error);
    return {
      platform: { App: 0, Web: 0, Other: 0 },
      pageEntry: {},
      feedback: { like: 0, dislike: 0 },
      issues: { noKnowledge: 0, emptyReply: 0 },
    };
  }
}

export type TagDimensionStats = Awaited<
  ReturnType<typeof getTagDimensionStats>
>;
