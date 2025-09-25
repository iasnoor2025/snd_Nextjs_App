ALTER TABLE "equipment" ADD COLUMN "insurance" text;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "insurance_expiry_date" date;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "tuv_card" text;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "tuv_card_expiry_date" date;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "priority" integer DEFAULT 999 NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;