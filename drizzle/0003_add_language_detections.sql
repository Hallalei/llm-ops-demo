-- 创建语种识别表
CREATE TABLE IF NOT EXISTS "pz9cwpnyi2mbyf3"."conversation_language_detections" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pz9cwpnyi2mbyf3"."conversation_language_detections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "conversation_id" integer NOT NULL,
  "language" text,
  "confidence" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "conversation_language_detections_conversation_id_unique" UNIQUE("conversation_id")
);

-- 为语种识别表添加 status 索引以提升批处理查询性能
CREATE INDEX IF NOT EXISTS "idx_language_detections_status"
ON "pz9cwpnyi2mbyf3"."conversation_language_detections" ("status");
