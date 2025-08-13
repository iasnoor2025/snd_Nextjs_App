ALTER TABLE "equipment_rental_history" ALTER COLUMN "start_date" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ALTER COLUMN "end_date" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "equipment_rental_history" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);