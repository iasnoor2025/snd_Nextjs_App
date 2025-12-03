DROP INDEX "timesheets_employee_id_date_key";--> statement-breakpoint
CREATE UNIQUE INDEX "timesheets_employee_id_date_key" ON "timesheets" USING btree ("employee_id" int4_ops,"date");