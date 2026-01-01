/**
 * 意图分类服务层
 * 使用 BatchProcessor 基类实现高并发批量分类
 */

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { conversationClassifications, conversations } from "@/db/schema";
import {
  BatchProcessor,
  type ProcessResult,
  type ProgressStats,
} from "@/lib/batch-processor";
import { PROCESSING_START_DATE } from "@/lib/constants";
import { getClassificationConfig } from "./config";
import { classifyIntent } from "./deepseek";

interface ClassificationRecord {
  id: number;
  query: string | null;
}

class ClassificationProcessor extends BatchProcessor<ClassificationRecord> {
  constructor() {
    super({
      concurrencyEnvKey: "CLASSIFY_CONCURRENCY",
      defaultConcurrency: 100,
    });
  }

  async getPendingRecords(limit: number): Promise<ClassificationRecord[]> {
    const dateCondition = gte(conversations.createdTime, PROCESSING_START_DATE);

    // 使用 LEFT JOIN ... IS NULL 代替 NOT IN，性能更优
    const result = await db
      .select({
        id: conversations.id,
        query: conversations.query,
      })
      .from(conversations)
      .leftJoin(
        conversationClassifications,
        and(
          sql`${conversations.id} = ${conversationClassifications.conversationId}`,
          eq(conversationClassifications.status, "completed"),
        ),
      )
      .where(and(dateCondition, sql`${conversationClassifications.id} IS NULL`))
      .orderBy(desc(conversations.id))
      .limit(limit);

    return result;
  }

  async processOne(record: ClassificationRecord): Promise<ProcessResult> {
    try {
      const { id, query } = record;

      if (!query || query.trim().length === 0) {
        await this.saveClassification(id, "other", "0");
        return { success: true };
      }

      const config = await getClassificationConfig();
      const result = await classifyIntent(query, config.categories);

      await this.saveClassification(
        id,
        result.category,
        result.confidence.toFixed(2),
      );

      return { success: true };
    } catch (error) {
      await db
        .insert(conversationClassifications)
        .values({
          conversationId: record.id,
          status: "failed",
        })
        .onConflictDoUpdate({
          target: conversationClassifications.conversationId,
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

  private async saveClassification(
    conversationId: number,
    category: string,
    confidence: string,
  ): Promise<void> {
    await db
      .insert(conversationClassifications)
      .values({
        conversationId,
        category,
        confidence,
        status: "completed",
      })
      .onConflictDoUpdate({
        target: conversationClassifications.conversationId,
        set: {
          category,
          confidence,
          status: "completed",
          updatedAt: sql`now()`,
        },
      });
  }

  async getRemainingCount(): Promise<number> {
    const [totalResult] = await db
      .select({ value: count() })
      .from(conversations)
      .where(gte(conversations.createdTime, PROCESSING_START_DATE));

    const [completedResult] = await db
      .select({ value: count() })
      .from(conversationClassifications)
      .where(eq(conversationClassifications.status, "completed"));

    return (totalResult?.value || 0) - (completedResult?.value || 0);
  }

  async getProgress(): Promise<ProgressStats> {
    const [totalResult] = await db
      .select({ value: count() })
      .from(conversations)
      .where(gte(conversations.createdTime, PROCESSING_START_DATE));

    const [completedResult] = await db
      .select({ value: count() })
      .from(conversationClassifications)
      .where(eq(conversationClassifications.status, "completed"));

    const [failedResult] = await db
      .select({ value: count() })
      .from(conversationClassifications)
      .where(eq(conversationClassifications.status, "failed"));

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
const classificationProcessor = new ClassificationProcessor();

/**
 * 批量分类记录
 */
export async function batchClassify(limit = 200): Promise<{
  success: number;
  failed: number;
  remaining: number;
}> {
  return classificationProcessor.batchProcess(limit);
}

/**
 * 获取分类进度统计
 */
export async function getClassificationProgress(): Promise<ProgressStats> {
  return classificationProcessor.getProgress();
}

// 导出向后兼容的函数
export { classificationProcessor };
