ALTER TABLE "employees" ALTER COLUMN "overtime_fixed_rate" SET DEFAULT '6';--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "overtime_fixed_rate" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "contract_days_per_month" SET DEFAULT 30;