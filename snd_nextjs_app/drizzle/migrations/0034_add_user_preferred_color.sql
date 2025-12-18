-- Add preferred_color field to users table for user color customization
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_color text;

