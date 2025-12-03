ALTER TABLE "skills" ADD COLUMN "required_level" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "certification_required" boolean DEFAULT false;