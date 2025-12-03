DROP TABLE "rental_operator_assignments" CASCADE;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "vat_number" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "credit_limit_used" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "credit_limit_remaining" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "current_due" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "total_value" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "outstanding_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "currency" text DEFAULT 'SAR';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "customer_type" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "customer_group" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "territory" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "sales_person" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "default_price_list" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "default_currency" text DEFAULT 'SAR';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "remarks" text;