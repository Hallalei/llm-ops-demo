import { client } from "@/db";

export async function runWithTaskLock(
  lockName: string,
  fn: () => Promise<void>,
): Promise<boolean> {
  try {
    return await client.begin(async (tx) => {
      const result = await tx`
        SELECT pg_try_advisory_xact_lock(hashtext(${lockName})::bigint) AS locked
      `;

      const locked = Boolean(result[0]?.locked);
      if (!locked) return false;

      await fn();
      return true;
    });
  } catch (error) {
    console.error(`[TaskLock] Failed to run with lock ${lockName}:`, error);
    return false;
  }
}
