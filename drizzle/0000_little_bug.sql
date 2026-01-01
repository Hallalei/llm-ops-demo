-- 只创建翻译表，不创建已存在的"灵思 实时数据"表
CREATE TABLE IF NOT EXISTS "pz9cwpnyi2mbyf3"."conversation_translations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pz9cwpnyi2mbyf3"."conversation_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"conversation_id" integer NOT NULL,
	"query_zh" text,
	"response_zh" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "conversation_translations_conversation_id_unique" UNIQUE("conversation_id")
);
