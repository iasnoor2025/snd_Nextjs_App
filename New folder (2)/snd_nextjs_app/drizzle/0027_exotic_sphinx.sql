ALTER TABLE "final_settlements" ADD COLUMN "absent_days" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "absent_deduction" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "absent_calculation_period" text;--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "absent_calculation_start_date" date;--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "absent_calculation_end_date" date;