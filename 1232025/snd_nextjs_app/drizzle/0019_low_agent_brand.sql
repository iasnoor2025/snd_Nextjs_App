ALTER TABLE "employee_leaves" ADD COLUMN "return_date" date;--> statement-breakpoint
ALTER TABLE "employee_leaves" ADD COLUMN "returned_by" integer;--> statement-breakpoint
ALTER TABLE "employee_leaves" ADD COLUMN "return_reason" text;