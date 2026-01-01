/**
 * 意图分类 API
 * POST: 触发批量分类（需 Bearer Token）
 * GET: 查询分类进度
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, parseBatchParams, withAuth } from "@/lib/api";
import {
  batchClassify,
  getClassificationProgress,
} from "@/lib/classification/service";

/**
 * GET /api/classify
 * 获取分类进度（公开接口）
 */
export async function GET() {
  try {
    const progress = await getClassificationProgress();
    return apiSuccess(progress);
  } catch (error) {
    return apiError(
      "获取分类进度失败",
      500,
      error instanceof Error ? error.message : "未知错误",
    );
  }
}

/**
 * POST /api/classify
 * 触发批量分类（需要认证）
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const limit = await parseBatchParams(request, { limit: 20, max: 200 });
    const stats = await batchClassify(limit);

    return apiSuccess({
      message: "批量分类完成",
      stats,
    });
  } catch (error) {
    return apiError(
      "批量分类失败",
      500,
      error instanceof Error ? error.message : "未知错误",
    );
  }
});
