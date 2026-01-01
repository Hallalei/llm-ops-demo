/**
 * 语种识别 API
 * POST: 触发批量识别（需 Bearer Token）
 * GET: 查询识别进度
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, parseBatchParams, withAuth } from "@/lib/api";
import {
  batchDetectLanguage,
  getLanguageDetectionProgress,
} from "@/lib/language-detection/service";

/**
 * GET /api/language-detect
 * 获取语种识别进度（公开接口）
 */
export async function GET() {
  try {
    const progress = await getLanguageDetectionProgress();
    return apiSuccess(progress);
  } catch (error) {
    return apiError(
      "获取语种识别进度失败",
      500,
      error instanceof Error ? error.message : "未知错误",
    );
  }
}

/**
 * POST /api/language-detect
 * 触发批量语种识别（需要认证）
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const limit = await parseBatchParams(request, { limit: 20, max: 200 });
    const stats = await batchDetectLanguage(limit);

    return apiSuccess({
      message: "批量语种识别完成",
      stats,
    });
  } catch (error) {
    return apiError(
      "批量语种识别失败",
      500,
      error instanceof Error ? error.message : "未知错误",
    );
  }
});
