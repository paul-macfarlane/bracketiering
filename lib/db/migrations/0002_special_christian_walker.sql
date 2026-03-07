CREATE TABLE "pool_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"pool_id" text NOT NULL,
	"created_by" text NOT NULL,
	"role" "pool_member_role" DEFAULT 'member' NOT NULL,
	"max_uses" integer,
	"use_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pool_invite" ADD CONSTRAINT "pool_invite_pool_id_pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_invite" ADD CONSTRAINT "pool_invite_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pool_invite_code_idx" ON "pool_invite" USING btree ("code");--> statement-breakpoint
CREATE INDEX "pool_invite_pool_id_idx" ON "pool_invite" USING btree ("pool_id");