ALTER TABLE "employee_training" ADD COLUMN "card_number" text;--> statement-breakpoint
ALTER TABLE "employee_training" ADD COLUMN "expiry_date" date;--> statement-breakpoint
ALTER TABLE "employee_training" ADD COLUMN "trainer_name" text;--> statement-breakpoint
ALTER TABLE "employee_training" ADD COLUMN "trainer_signature" text;--> statement-breakpoint
ALTER TABLE "employee_training" ADD COLUMN "qr_code_url" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_external" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "rental_items" ADD COLUMN "supervisor_id" integer;