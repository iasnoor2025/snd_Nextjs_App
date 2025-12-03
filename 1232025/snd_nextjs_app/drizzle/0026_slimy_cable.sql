ALTER TABLE "final_settlements" ADD COLUMN "settlement_type" text DEFAULT 'exit' NOT NULL;--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "vacation_start_date" date;--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "vacation_end_date" date;--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "expected_return_date" date;--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "vacation_days" integer;