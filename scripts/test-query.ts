import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { conversations } from "../src/db/schema";

async function test() {
  // 查看前5条数据的质量字段
  const result = await db
    .select({
      id: conversations.id,
      precision: conversations.precision,
      relevance: conversations.relevance,
      languageMatch: conversations.languageMatch,
      fidelity: conversations.fidelity,
    })
    .from(conversations)
    .limit(5);

  console.log("Sample data:", JSON.stringify(result, null, 2));

  // 尝试查询低忠诚度的
  const lowFidelity = await db
    .select({ count: sql<number>`count(*)` })
    .from(conversations)
    .where(
      sql`"忠诚度" IS NOT NULL AND "忠诚度" != '' AND CAST("忠诚度" AS DECIMAL) < 0.6`,
    );

  console.log("Low fidelity count:", lowFidelity);

  process.exit(0);
}

test().catch(console.error);
