/**
 * 翻译 API 路由
 * POST /api/translate - 触发批量翻译任务
 * GET /api/translate - 查询翻译进度
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, parseBatchParams, withAuth } from "@/lib/api";
import {
  batchTranslate,
  getTranslationProgress,
} from "@/lib/translation/service";

/**
 * GET /api/translate
 * 查询翻译进度（公开接口）
 */
export async function GET() {
  try {
    const progress = await getTranslationProgress();

    return apiSuccess({
      ...progress,
      completionRate:
        progress.total > 0
          ? `${((progress.completed / progress.total) * 100).toFixed(2)}%`
          : "0%",
    });
  } catch (error) {
    return apiError(
      "查询失败",
      500,
      error instanceof Error ? error.message : "未知错误",
    );
  }
}

/**
 * POST /api/translate
 * 触发批量翻译（需要认证）
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const batchSize = await parseBatchParams(request, { limit: 10, max: 100 });
    const stats = await batchTranslate(batchSize);

    return apiSuccess({
      success: stats.success,
      failed: stats.failed,
      skipped: stats.skipped,
      remaining: stats.remaining,
      message: `成功翻译 ${stats.success} 条，失败 ${stats.failed} 条，剩余 ${stats.remaining} 条`,
    });
  } catch (error) {
    return apiError(
      "翻译服务异常",
      500,
      error instanceof Error ? error.message : "未知错误",
    );
  }
});
