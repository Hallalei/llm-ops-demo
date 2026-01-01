/**
 * 翻译服务层
 * 使用 BatchProcessor 基类实现高并发批量翻译
 */

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { conversations, conversationTranslations } from "@/db/schema";
import {
  BatchProcessor,
  type ProcessResult,
  type ProgressStats,
} from "@/lib/batch-processor";
import { PROCESSING_START_DATE } from "@/lib/constants";
import { needsTranslation, translateToZh } from "./deepseek";

interface TranslationRecord {
  id: number;
  query: string | null;
  response: string | null;
}

interface TranslationStats {
  success: number;
  failed: number;
  skipped: number;
  remaining: number;
}

class TranslationProcessor extends BatchProcessor<TranslationRecord> {
  constructor() {
    super({
      concurrencyEnvKey: "TRANSLATE_CONCURRENCY",
      defaultConcurrency: 50,
    });
  }

  async getPendingRecords(limit: number): Promise<TranslationRecord[]> {
    const dateCondition = gte(conversations.createdTime, PROCESSING_START_DATE);

    // 使用 LEFT JOIN ... IS NULL 代替 NOT IN，性能更优
    const result = await db
      .select({
        id: conversations.id,
        query: conversations.query,
        response: conversations.response,
      })
      .from(conversations)
      .leftJoin(
        conversationTranslations,
        and(
          sql`${conversations.id} = ${conversationTranslations.conversationId}`,
          eq(conversationTranslations.status, "completed"),
        ),
      )
      .where(and(dateCondition, sql`${conversationTranslations.id} IS NULL`))
      .orderBy(desc(conversations.id))
      .limit(limit);

    return result;
  }

  async processOne(record: TranslationRecord): Promise<ProcessResult> {
    try {
      const { id, query, response } = record;

      const queryNeedsTranslation = query && needsTranslation(query);
      const responseNeedsTranslation = response && needsTranslation(response);

      if (!queryNeedsTranslation && !responseNeedsTranslation) {
        await db
          .insert(conversationTranslations)
          .values({
            conversationId: id,
            queryZh: query,
            responseZh: response,
            status: "completed",
          })
          .onConflictDoUpdate({
            target: conversationTranslations.conversationId,
            set: {
              queryZh: query,
              responseZh: response,
              status: "completed",
              updatedAt: sql`now()`,
            },
          });

        return { success: true, skipped: true };
      }

      const result = await translateToZh(query || "", response || "");

      await db
        .insert(conversationTranslations)
        .values({
          conversationId: id,
          queryZh: result.queryZh || query,
          responseZh: result.responseZh || response,
          status: "completed",
        })
        .onConflictDoUpdate({
          target: conversationTranslations.conversationId,
          set: {
            queryZh: result.queryZh || query,
            responseZh: result.responseZh || response,
            status: "completed",
            updatedAt: sql`now()`,
          },
        });

      return { success: true };
    } catch (error) {
      await db
        .insert(conversationTranslations)
        .values({
          conversationId: record.id,
          status: "failed",
        })
        .onConflictDoUpdate({
          target: conversationTranslations.conversationId,
          set: {
            status: "failed",
            updatedAt: sql`now()`,
          },
        });

      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  async getRemainingCount(): Promise<number> {
    const [totalResult] = await db
      .select({ value: count() })
      .from(conversations)
      .where(gte(conversations.createdTime, PROCESSING_START_DATE));

    const [completedResult] = await db
      .select({ value: count() })
      .from(conversationTranslations)
      .where(eq(conversationTranslations.status, "completed"));

    return (totalResult?.value || 0) - (completedResult?.value || 0);
  }

  async getProgress(): Promise<ProgressStats> {
    const [totalResult] = await db
      .select({ value: count() })
      .from(conversations)
      .where(gte(conversations.createdTime, PROCESSING_START_DATE));

    const [completedResult] = await db
      .select({ value: count() })
      .from(conversationTranslations)
      .where(eq(conversationTranslations.status, "completed"));

    const [failedResult] = await db
      .select({ value: count() })
      .from(conversationTranslations)
      .where(eq(conversationTranslations.status, "failed"));

    const total = totalResult?.value || 0;
    const completed = completedResult?.value || 0;
    const failed = failedResult?.value || 0;

    return {
      total,
      completed,
      failed,
      pending: total - completed - failed,
    };
  }
}

// 单例实例
const translationProcessor = new TranslationProcessor();

/**
 * 批量翻译记录
 */
export async function batchTranslate(limit = 100): Promise<TranslationStats> {
  const pendingRecords = await translationProcessor.getPendingRecords(limit);

  const stats: TranslationStats = {
    success: 0,
    failed: 0,
    skipped: 0,
    remaining: 0,
  };

  if (pendingRecords.length === 0) {
    stats.remaining = await translationProcessor.getRemainingCount();
    return stats;
  }

  const concurrency = Number(process.env.TRANSLATE_CONCURRENCY) || 50;

  for (let i = 0; i < pendingRecords.length; i += concurrency) {
    const batch = pendingRecords.slice(i, i + concurrency);

    const results = await Promise.all(
      batch.map((record) => translationProcessor.processOne(record)),
    );

    for (const result of results) {
      if (result.success) {
        if (result.skipped) {
          stats.skipped++;
        } else {
          stats.success++;
        }
      } else {
        stats.failed++;
      }
    }
  }

  stats.remaining = await translationProcessor.getRemainingCount();
  return stats;
}

/**
 * 获取翻译进度统计
 */
export async function getTranslationProgress(): Promise<ProgressStats> {
  return translationProcessor.getProgress();
}

// 导出向后兼容的函数
export { translationProcessor };
