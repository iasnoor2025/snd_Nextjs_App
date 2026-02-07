CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_name" text,
	"action" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text,
	"description" text NOT NULL,
	"changes" jsonb,
	"ip_address" text,
	"user_agent" text,
	"severity" text DEFAULT 'low' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "driving_authorization_start_date" date;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "driving_authorization_end_date" date;--> statement-breakpoint
ALTER TABLE "rental_invoices" ADD COLUMN "billing_month" text;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_color" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;