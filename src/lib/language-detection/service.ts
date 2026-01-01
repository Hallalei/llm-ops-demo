/**
 * 语种识别服务层
 * 使用 BatchProcessor 基类实现高并发批量识别
 */

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { conversationLanguageDetections, conversations } from "@/db/schema";
import {
  BatchProcessor,
  type ProcessResult,
  type ProgressStats,
} from "@/lib/batch-processor";
import { PROCESSING_START_DATE } from "@/lib/constants";
import { getLanguageDetectionConfig } from "./config";
import { detectLanguage } from "./deepseek";

interface LanguageDetectionRecord {
  id: number;
  query: string | null;
}

class LanguageDetectionProcessor extends BatchProcessor<LanguageDetectionRecord> {
  constructor() {
    super({
      concurrencyEnvKey: "LANGUAGE_DETECT_CONCURRENCY",
      defaultConcurrency: 100,
    });
  }

  async getPendingRecords(limit: number): Promise<LanguageDetectionRecord[]> {
    const dateCondition = gte(conversations.createdTime, PROCESSING_START_DATE);

    const result = await db
      .select({
        id: conversations.id,
        query: conversations.query,
      })
      .from(conversations)
      .leftJoin(
        conversationLanguageDetections,
        and(
          sql`${conversations.id} = ${conversationLanguageDetections.conversationId}`,
          eq(conversationLanguageDetections.status, "completed"),
        ),
      )
      .where(
        and(dateCondition, sql`${conversationLanguageDetections.id} IS NULL`),
      )
      .orderBy(desc(conversations.id))
      .limit(limit);

    return result;
  }

  async processOne(record: LanguageDetectionRecord): Promise<ProcessResult> {
    try {
      const { id, query } = record;

      if (!query || query.trim().length === 0) {
        await this.saveDetection(id, "other", "0");
        return { success: true };
      }

      const config = await getLanguageDetectionConfig();
      const result = await detectLanguage(query, config.languages);

      await this.saveDetection(
        id,
        result.language,
        result.confidence.toFixed(2),
      );

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      console.error(`[语种识别] ID ${record.id} 失败:`, errorMsg);

      await db
        .insert(conversationLanguageDetections)
        .values({
          conversationId: record.id,
          status: "failed",
        })
        .onConflictDoUpdate({
          target: conversationLanguageDetections.conversationId,
          set: {
            status: "failed",
            updatedAt: sql`now()`,
          },
        });

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  private async saveDetection(
    conversationId: number,
    language: string,
    confidence: string,
  ): Promise<void> {
    await db
      .insert(conversationLanguageDetections)
      .values({
        conversationId,
        language,
        confidence,
        status: "completed",
      })
      .onConflictDoUpdate({
        target: conversationLanguageDetections.conversationId,
        set: {
          language,
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
      .from(conversationLanguageDetections)
      .where(eq(conversationLanguageDetections.status, "completed"));

    return (totalResult?.value || 0) - (completedResult?.value || 0);
  }

  async getProgress(): Promise<ProgressStats> {
    const [totalResult] = await db
      .select({ value: count() })
      .from(conversations)
      .where(gte(conversations.createdTime, PROCESSING_START_DATE));

    const [completedResult] = await db
      .select({ value: count() })
      .from(conversationLanguageDetections)
      .where(eq(conversationLanguageDetections.status, "completed"));

    const [failedResult] = await db
      .select({ value: count() })
      .from(conversationLanguageDetections)
      .where(eq(conversationLanguageDetections.status, "failed"));

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

const languageDetectionProcessor = new LanguageDetectionProcessor();

/**
 * 批量识别语种
 */
export async function batchDetectLanguage(limit = 200): Promise<{
  success: number;
  failed: number;
  remaining: number;
}> {
  return languageDetectionProcessor.batchProcess(limit);
}

/**
 * 获取语种识别进度统计
 */
export async function getLanguageDetectionProgress(): Promise<ProgressStats> {
  return languageDetectionProcessor.getProgress();
}

export { languageDetectionProcessor };
