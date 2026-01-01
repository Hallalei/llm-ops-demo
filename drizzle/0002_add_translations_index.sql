-- 为翻译表添加 status 索引以提升批处理查询性能
CREATE INDEX IF NOT EXISTS "idx_translations_status"
ON "pz9cwpnyi2mbyf3"."conversation_translations" ("status");

CREATE INDEX IF NOT EXISTS "idx_translations_conversation_id"
ON "pz9cwpnyi2mbyf3"."conversation_translations" ("conversation_id");
