import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function migrate() {
  console.log("Creating conversation_language_detections table...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pz9cwpnyi2mbyf3"."conversation_language_detections" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        "conversation_id" integer NOT NULL,
        "language" text,
        "confidence" text,
        "status" text DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "conversation_language_detections_conversation_id_unique" UNIQUE("conversation_id")
      )
    `);
    console.log("Table created successfully!");

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_language_detections_status"
      ON "pz9cwpnyi2mbyf3"."conversation_language_detections" ("status")
    `);
    console.log("Index created successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }

  process.exit(0);
}

migrate();
