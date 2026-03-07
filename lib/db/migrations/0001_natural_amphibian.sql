CREATE TYPE "public"."pool_member_role" AS ENUM('leader', 'member');--> statement-breakpoint
CREATE TABLE "pool" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"max_brackets_per_user" integer DEFAULT 5 NOT NULL,
	"max_participants" integer DEFAULT 50 NOT NULL,
	"scoring_first_four" integer DEFAULT 0 NOT NULL,
	"scoring_round_64" integer DEFAULT 1 NOT NULL,
	"scoring_round_32" integer DEFAULT 2 NOT NULL,
	"scoring_sweet_16" integer DEFAULT 4 NOT NULL,
	"scoring_elite_8" integer DEFAULT 8 NOT NULL,
	"scoring_final_four" integer DEFAULT 16 NOT NULL,
	"scoring_championship" integer DEFAULT 32 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_member" (
	"id" text PRIMARY KEY NOT NULL,
	"pool_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "pool_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pool_member" ADD CONSTRAINT "pool_member_pool_id_pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_member" ADD CONSTRAINT "pool_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pool_member_pool_id_idx" ON "pool_member" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "pool_member_user_id_idx" ON "pool_member" USING btree ("user_id");