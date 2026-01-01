/**
 * 任务管理器
 * 用于管理后台定时任务的启停和状态
 */

import type { ScheduledTask } from "node-cron";
import { runWithTaskLock } from "./lock";

export type TaskName = "translation" | "classification" | "language-detection";

export interface TaskStatus {
  enabled: boolean;
  running: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  schedule: string;
}

export interface TaskConfig {
  schedule: string;
  batchSize: number;
  concurrency: number;
  executor: () => Promise<void>;
}

interface TaskEntry {
  status: TaskStatus;
  cronJob: ScheduledTask | null;
  config: TaskConfig | null;
}

// 使用 globalThis 确保单例，避免模块重新加载导致状态丢失
const globalForTasks = globalThis as typeof globalThis & {
  __taskManagerTasks?: Map<TaskName, TaskEntry>;
  __taskManagerInitialized?: boolean;
};

const tasks =
  globalForTasks.__taskManagerTasks ?? new Map<TaskName, TaskEntry>();
globalForTasks.__taskManagerTasks = tasks;

let tasksInitialized = globalForTasks.__taskManagerInitialized ?? false;

const defaultStatus: TaskStatus = {
  enabled: false,
  running: false,
  lastRunAt: null,
  nextRunAt: null,
  schedule: "*/1 * * * *",
};

// 初始化任务条目
function initTask(name: TaskName): TaskEntry {
  const entry: TaskEntry = {
    status: { ...defaultStatus },
    cronJob: null,
    config: null,
  };
  tasks.set(name, entry);
  return entry;
}

export function getTaskStatus(name: TaskName): TaskStatus {
  const entry = tasks.get(name);
  if (!entry) {
    return { ...defaultStatus };
  }
  return { ...entry.status };
}

export function getAllTasksStatus(): Record<TaskName, TaskStatus> {
  const allTasks: TaskName[] = [
    "translation",
    "classification",
    "language-detection",
  ];
  const result: Record<string, TaskStatus> = {};
  for (const name of allTasks) {
    result[name] = getTaskStatus(name);
  }
  return result as Record<TaskName, TaskStatus>;
}

export function setTaskRunning(name: TaskName, running: boolean): void {
  let entry = tasks.get(name);
  if (!entry) {
    entry = initTask(name);
  }
  entry.status.running = running;
  if (running) {
    entry.status.lastRunAt = new Date().toISOString();
  }
}

export function registerTask(
  name: TaskName,
  cronJob: ScheduledTask,
  config: TaskConfig,
  autoStart = true,
): void {
  let entry = tasks.get(name);
  if (!entry) {
    entry = initTask(name);
  }
  entry.cronJob = cronJob;
  entry.config = config;
  entry.status.enabled = autoStart;
  entry.status.schedule = config.schedule;
  if (autoStart) {
    updateNextRunAt(name);
  }
}

function updateNextRunAt(name: TaskName): void {
  const entry = tasks.get(name);
  if (!entry?.cronJob) return;

  // 计算下次执行时间（简化版，基于 schedule 推算）
  const now = new Date();
  const nextMinute = new Date(now);
  nextMinute.setSeconds(0);
  nextMinute.setMilliseconds(0);
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);
  entry.status.nextRunAt = nextMinute.toISOString();
}

export async function startTask(name: TaskName): Promise<boolean> {
  // 确保任务已注册
  await ensureTasksRegistered();

  const entry = tasks.get(name);
  if (!entry?.cronJob) {
    console.log(`[TaskManager] 任务 ${name} 未注册，无法启动`);
    return false;
  }

  if (entry.status.enabled) {
    console.log(`[TaskManager] 任务 ${name} 已在运行中`);
    return true;
  }

  entry.cronJob.start();
  entry.status.enabled = true;
  updateNextRunAt(name);
  console.log(`[TaskManager] 任务 ${name} 已启动`);
  return true;
}

export async function stopTask(name: TaskName): Promise<boolean> {
  // 确保任务已注册
  await ensureTasksRegistered();

  const entry = tasks.get(name);
  if (!entry?.cronJob) {
    console.log(`[TaskManager] 任务 ${name} 未注册，无法停止`);
    return false;
  }

  if (!entry.status.enabled) {
    console.log(`[TaskManager] 任务 ${name} 已停止`);
    return true;
  }

  entry.cronJob.stop();
  entry.status.enabled = false;
  entry.status.nextRunAt = null;
  console.log(`[TaskManager] 任务 ${name} 已停止`);
  return true;
}

export function isTaskRegistered(name: TaskName): boolean {
  const entry = tasks.get(name);
  return !!entry?.cronJob;
}

// 懒加载：确保任务已注册
async function ensureTasksRegistered(): Promise<void> {
  if (tasksInitialized) return;

  // 只在 Node.js 环境下执行
  if (typeof window !== "undefined") return;

  console.log("[TaskManager] 正在懒加载注册任务...");

  const cron = (await import("node-cron")).default;

  // 注册翻译任务
  await registerTranslationTask(cron);
  // 注册分类任务
  await registerClassificationTask(cron);
  // 注册语种识别任务
  await registerLanguageDetectionTask(cron);

  tasksInitialized = true;
  globalForTasks.__taskManagerInitialized = true;
  console.log("[TaskManager] 所有任务注册完成");
}

async function registerTranslationTask(
  cron: typeof import("node-cron").default,
): Promise<void> {
  const { batchTranslate } = await import("@/lib/translation/service");
  const schedule = process.env.TRANSLATE_CRON_SCHEDULE || "*/1 * * * *";
  const batchSize = Number(process.env.TRANSLATE_BATCH_SIZE) || 100;
  const concurrency = Number(process.env.TRANSLATE_CONCURRENCY) || 50;

  // 保留现有状态，仅首次初始化时使用环境变量
  const existingEntry = tasks.get("translation");
  const shouldAutoStart = existingEntry
    ? existingEntry.status.enabled
    : process.env.ENABLE_AUTO_TRANSLATE === "true";

  const executor = async () => {
    const executed = await runWithTaskLock(
      "deye-llm-ops:task:translation",
      async () => {
        const timestamp = new Date().toLocaleString("zh-CN", {
          timeZone: "Asia/Shanghai",
        });
        console.log(
          `\n[翻译任务] ${timestamp} 开始翻译，批次: ${batchSize}，并发: ${concurrency}`,
        );
        setTaskRunning("translation", true);
        try {
          const stats = await batchTranslate(batchSize);
          console.log(
            `[翻译任务] 完成 - 成功: ${stats.success}, 跳过: ${stats.skipped}, 失败: ${stats.failed}, 剩余: ${stats.remaining}`,
          );
        } catch (error) {
          console.error(`[翻译任务] 翻译失败:`, error);
        } finally {
          setTaskRunning("translation", false);
        }
      },
    );

    if (!executed) {
      console.log("[翻译任务] 跳过：已有实例在运行");
    }
  };

  const cronJob = cron.createTask(schedule, executor);
  if (shouldAutoStart) {
    cronJob.start();
  }
  registerTask(
    "translation",
    cronJob,
    { schedule, batchSize, concurrency, executor },
    shouldAutoStart,
  );
}

async function registerClassificationTask(
  cron: typeof import("node-cron").default,
): Promise<void> {
  const { batchClassify } = await import("@/lib/classification/service");
  const schedule = process.env.CLASSIFY_CRON_SCHEDULE || "*/1 * * * *";
  const batchSize = Number(process.env.CLASSIFY_BATCH_SIZE) || 200;
  const concurrency = Number(process.env.CLASSIFY_CONCURRENCY) || 100;

  // 保留现有状态，仅首次初始化时使用环境变量
  const existingEntry = tasks.get("classification");
  const shouldAutoStart = existingEntry
    ? existingEntry.status.enabled
    : process.env.ENABLE_AUTO_CLASSIFY === "true";

  const executor = async () => {
    const executed = await runWithTaskLock(
      "deye-llm-ops:task:classification",
      async () => {
        const timestamp = new Date().toLocaleString("zh-CN", {
          timeZone: "Asia/Shanghai",
        });
        console.log(
          `\n[分类任务] ${timestamp} 开始分类，批次: ${batchSize}，并发: ${concurrency}`,
        );
        setTaskRunning("classification", true);
        try {
          const stats = await batchClassify(batchSize);
          console.log(
            `[分类任务] 完成 - 成功: ${stats.success}, 失败: ${stats.failed}, 剩余: ${stats.remaining}`,
          );
        } catch (error) {
          console.error(`[分类任务] 分类失败:`, error);
        } finally {
          setTaskRunning("classification", false);
        }
      },
    );

    if (!executed) {
      console.log("[分类任务] 跳过：已有实例在运行");
    }
  };

  const cronJob = cron.createTask(schedule, executor);
  if (shouldAutoStart) {
    cronJob.start();
  }
  registerTask(
    "classification",
    cronJob,
    { schedule, batchSize, concurrency, executor },
    shouldAutoStart,
  );
}

async function registerLanguageDetectionTask(
  cron: typeof import("node-cron").default,
): Promise<void> {
  const { batchDetectLanguage } = await import(
    "@/lib/language-detection/service"
  );
  const schedule = process.env.LANGUAGE_DETECT_CRON_SCHEDULE || "*/1 * * * *";
  const batchSize = Number(process.env.LANGUAGE_DETECT_BATCH_SIZE) || 200;
  const concurrency = Number(process.env.LANGUAGE_DETECT_CONCURRENCY) || 100;

  // 保留现有状态，仅首次初始化时使用环境变量
  const existingEntry = tasks.get("language-detection");
  const shouldAutoStart = existingEntry
    ? existingEntry.status.enabled
    : process.env.ENABLE_AUTO_LANGUAGE_DETECT === "true";

  const executor = async () => {
    const executed = await runWithTaskLock(
      "deye-llm-ops:task:language-detection",
      async () => {
        const timestamp = new Date().toLocaleString("zh-CN", {
          timeZone: "Asia/Shanghai",
        });
        console.log(
          `\n[语种识别任务] ${timestamp} 开始识别，批次: ${batchSize}，并发: ${concurrency}`,
        );
        setTaskRunning("language-detection", true);
        try {
          const stats = await batchDetectLanguage(batchSize);
          console.log(
            `[语种识别任务] 完成 - 成功: ${stats.success}, 失败: ${stats.failed}, 剩余: ${stats.remaining}`,
          );
        } catch (error) {
          console.error(`[语种识别任务] 识别失败:`, error);
        } finally {
          setTaskRunning("language-detection", false);
        }
      },
    );

    if (!executed) {
      console.log("[语种识别任务] 跳过：已有实例在运行");
    }
  };

  const cronJob = cron.createTask(schedule, executor);
  if (shouldAutoStart) {
    cronJob.start();
  }
  registerTask(
    "language-detection",
    cronJob,
    { schedule, batchSize, concurrency, executor },
    shouldAutoStart,
  );
}

// 导出初始化函数供 API 调用
export { ensureTasksRegistered };
