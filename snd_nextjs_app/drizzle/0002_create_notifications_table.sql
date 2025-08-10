CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "data" jsonb,
  "timestamp" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read" boolean NOT NULL DEFAULT false,
  "action_url" text,
  "priority" text NOT NULL DEFAULT 'medium',
  "user_email" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "notifications_user_email_idx" ON "notifications" ("user_email");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications" ("read");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_email_read_idx" ON "notifications" ("user_email", "read");
