/**
 * 创建翻译表
 */

import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function createTranslationTable() {
  console.log("正在创建翻译表...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pz9cwpnyi2mbyf3"."conversation_translations" (
        "id" SERIAL PRIMARY KEY,
        "conversation_id" integer NOT NULL UNIQUE,
        "query_zh" text,
        "response_zh" text,
        "status" text DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);

    console.log("✅ 翻译表创建成功！");
  } catch (error) {
    console.error("❌ 创建表失败:", error);
    throw error;
  }
}

createTranslationTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
