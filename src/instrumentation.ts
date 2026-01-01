/**
 * Next.js Instrumentation
 * 在服务端初始化时执行，用于启动后台任务
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

/**
 * 注册服务端任务
 * 任务注册逻辑已统一移至 task-manager 模块的懒加载机制
 * instrumentation 仅负责在服务启动时触发初始化
 *
 * Note: This only runs in Node.js runtime, not Edge runtime
 */
export async function register() {
  // Edge Runtime 完全跳过，不做任何导入
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  // 只在 Node.js 环境下执行
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[Instrumentation] 正在初始化任务管理器...");

    // 触发任务管理器的懒加载初始化
    const { ensureTasksRegistered } = await import("@/lib/task-manager");
    await ensureTasksRegistered();

    console.log("[Instrumentation] 任务管理器初始化完成");
  }
}

/**
 * Edge runtime instrumentation
 * Keep this empty to avoid bundling Node.js modules
 */
export function onRequestError() {
  // No-op for Edge runtime
}
