/**
 * 任务状态 API
 * GET /api/tasks/status - 获取所有任务状态
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { withRoles } from "@/lib/auth/api-guards";
import { ensureTasksRegistered, getAllTasksStatus } from "@/lib/task-manager";

const superadminRoles = ["superadmin"] as const;

export const GET = withRoles(superadminRoles, async () => {
  try {
    // 调用 headers() 强制动态渲染
    await headers();

    // 确保任务已注册
    await ensureTasksRegistered();

    const status = getAllTasksStatus();

    // 设置响应头禁止缓存
    const response = NextResponse.json(status);
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );
    return response;
  } catch (error) {
    return apiError(
      "获取任务状态失败",
      500,
      error instanceof Error ? error.message : "未知错误",
    );
  }
});
