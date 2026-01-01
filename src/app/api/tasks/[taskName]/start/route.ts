/**
 * 启动任务 API
 * POST /api/tasks/[taskName]/start
 */

import { apiError, apiSuccess } from "@/lib/api";
import { withRoles } from "@/lib/auth/api-guards";
import { startTask, type TaskName } from "@/lib/task-manager";

const validTasks: TaskName[] = [
  "translation",
  "classification",
  "language-detection",
];

const superadminRoles = ["superadmin"] as const;

export const POST = withRoles(
  superadminRoles,
  async (
    _request: Request,
    { params }: { params: Promise<{ taskName: string }> },
  ) => {
    try {
      const { taskName } = await params;

      if (!validTasks.includes(taskName as TaskName)) {
        return apiError("无效的任务名称", 400);
      }

      const success = await startTask(taskName as TaskName);

      if (success) {
        return apiSuccess({ message: `任务 ${taskName} 已启动` });
      } else {
        return apiError("任务启动失败，可能未注册", 400);
      }
    } catch (error) {
      return apiError(
        "启动任务失败",
        500,
        error instanceof Error ? error.message : "未知错误",
      );
    }
  },
);
