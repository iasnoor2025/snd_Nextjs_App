-- Migration script to add completedDate field to rental_items table
-- This script adds the completed_date column to the existing rental_items table

-- Add the completed_date column
ALTER TABLE rental_items 
ADD COLUMN completed_date DATE;

-- Add a comment to document the field
COMMENT ON COLUMN rental_items.completed_date IS 'Date when the rental item was completed (set to one day before new item start date)';

-- Update any existing rental items that should be marked as completed
-- This is optional and depends on your business logic
-- UPDATE rental_items 
-- SET completed_date = CURRENT_DATE - INTERVAL '1 day',
--     status = 'completed'
-- WHERE status = 'active' 
--   AND rental_id IN (
--     SELECT rental_id 
--     FROM rental_items 
--     WHERE start_date IS NOT NULL 
--     GROUP BY rental_id 
--     HAVING COUNT(*) > 1
--   );
