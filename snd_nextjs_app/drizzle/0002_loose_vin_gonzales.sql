ALTER TABLE "time_entries" ALTER COLUMN "start_time" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "end_time" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "start_time" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "end_time" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "submitted_at" SET DATA TYPE timestamp(3);