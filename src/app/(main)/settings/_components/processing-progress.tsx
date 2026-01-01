"use client";

import { Loader2, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { TaskName, TaskStatus } from "@/lib/task-manager";

interface ProgressStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
}

interface ProcessingProgressProps {
  apiEndpoint: string;
  title: string;
  taskName: TaskName;
}

export function ProcessingProgress({
  apiEndpoint,
  title,
  taskName,
}: ProcessingProgressProps) {
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [progressRes, statusRes] = await Promise.all([
        fetch(apiEndpoint),
        fetch("/api/tasks/status"),
      ]);

      if (progressRes.ok) {
        const data = (await progressRes.json()) as ProgressStats;
        setProgress(data);
      }

      if (statusRes.ok) {
        const statusData = (await statusRes.json()) as Record<
          TaskName,
          TaskStatus
        >;
        setTaskStatus(statusData[taskName]);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, taskName]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleToggleTask = async () => {
    if (!taskStatus) return;

    setIsToggling(true);
    try {
      const action = taskStatus.enabled ? "stop" : "start";
      const res = await fetch(`/api/tasks/${taskName}/${action}`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success(taskStatus.enabled ? "任务已停止" : "任务已启动");
        await fetchData();
      } else {
        const error = (await res.json()) as { message?: string };
        toast.error(error.message || "操作失败");
      }
    } catch {
      toast.error("操作失败");
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">加载{title}进度...</p>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const { total, completed, failed, pending } = progress;
  const completedPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const isEnabled = taskStatus?.enabled ?? false;
  const isRunning = taskStatus?.running ?? false;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{title}任务</h3>
          <div className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${
                isEnabled
                  ? isRunning
                    ? "animate-pulse bg-green-500"
                    : "bg-green-500"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-muted-foreground text-xs">
              {isEnabled ? (isRunning ? "执行中" : "运行中") : "已停止"}
            </span>
          </div>
        </div>
        <Button
          variant={isEnabled ? "outline" : "default"}
          size="sm"
          onClick={handleToggleTask}
          disabled={isToggling}
        >
          {isToggling ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : isEnabled ? (
            <Pause className="mr-1.5 size-4" />
          ) : (
            <Play className="mr-1.5 size-4" />
          )}
          {isEnabled ? "停止任务" : "启动任务"}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">整体进度</span>
          <span className="font-medium">
            {completed.toLocaleString("zh-CN")} /{" "}
            {total.toLocaleString("zh-CN")} ({completedPercent}%)
          </span>
        </div>
        <Progress value={completedPercent} className="h-2" />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-medium text-green-600 dark:text-green-400">
            {completed.toLocaleString("zh-CN")}
          </div>
          <div className="text-muted-foreground">已完成</div>
        </div>
        <div>
          <div className="font-medium text-yellow-600 dark:text-yellow-400">
            {pending.toLocaleString("zh-CN")}
          </div>
          <div className="text-muted-foreground">待处理</div>
        </div>
        <div>
          <div className="font-medium text-red-600 dark:text-red-400">
            {failed.toLocaleString("zh-CN")}
          </div>
          <div className="text-muted-foreground">失败</div>
        </div>
      </div>

      {taskStatus && (taskStatus.lastRunAt || taskStatus.nextRunAt) && (
        <div className="border-t pt-3 text-muted-foreground text-xs">
          {taskStatus.lastRunAt && (
            <div>
              上次执行: {new Date(taskStatus.lastRunAt).toLocaleString("zh-CN")}
            </div>
          )}
          {taskStatus.nextRunAt && isEnabled && (
            <div>
              下次执行: {new Date(taskStatus.nextRunAt).toLocaleString("zh-CN")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
