-- 创建意图分类表
CREATE TABLE IF NOT EXISTS "pz9cwpnyi2mbyf3"."conversation_classifications" (
  "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "conversation_id" INTEGER NOT NULL UNIQUE,
  "category" TEXT,
  "confidence" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS "idx_classifications_conversation_id"
ON "pz9cwpnyi2mbyf3"."conversation_classifications" ("conversation_id");

CREATE INDEX IF NOT EXISTS "idx_classifications_status"
ON "pz9cwpnyi2mbyf3"."conversation_classifications" ("status");

CREATE INDEX IF NOT EXISTS "idx_classifications_category"
ON "pz9cwpnyi2mbyf3"."conversation_classifications" ("category");
