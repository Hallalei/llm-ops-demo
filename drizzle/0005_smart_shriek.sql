CREATE TABLE IF NOT EXISTS "pz9cwpnyi2mbyf3"."conversation_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"conversation_id" integer NOT NULL,
	"status" text DEFAULT 'reviewed' NOT NULL,
	"note" text,
	"reviewed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pz9cwpnyi2mbyf3"."conversation_reviews" ADD CONSTRAINT "conversation_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "pz9cwpnyi2mbyf3"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;