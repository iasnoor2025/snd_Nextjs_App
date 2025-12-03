ALTER TABLE "trainings" ALTER COLUMN "duration" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "max_participants" integer;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "prerequisites" text;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "objectives" text;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "materials" text;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;