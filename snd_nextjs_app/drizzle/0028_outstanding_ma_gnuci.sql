ALTER TABLE "final_settlements" ALTER COLUMN "unpaid_salary_months" SET DATA TYPE numeric(4, 1);--> statement-breakpoint
ALTER TABLE "final_settlements" ALTER COLUMN "unpaid_salary_months" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "vacation_duration_months" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "overtime_hours" numeric(8, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "final_settlements" ADD COLUMN "overtime_amount" numeric(10, 2) DEFAULT '0';