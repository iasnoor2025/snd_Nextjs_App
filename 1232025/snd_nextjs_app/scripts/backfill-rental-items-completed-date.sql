-- Backfill completedDate for rental items that are completed but missing completedDate
-- This script updates rental_items that have status = 'completed' but completed_date IS NULL

-- Update rental items that are completed but missing completedDate
-- Use the rental's actualEndDate if available, otherwise use updated_at date
UPDATE rental_items ri
SET completed_date = COALESCE(
  (SELECT r.actual_end_date FROM rentals r WHERE r.id = ri.rental_id),
  ri.updated_at::date,
  CURRENT_DATE
)
WHERE ri.status = 'completed' 
  AND ri.completed_date IS NULL;

-- Also update rental items based on equipment_rental_history endDate if rental doesn't have actualEndDate
UPDATE rental_items ri
SET completed_date = COALESCE(
  ri.completed_date,
  (SELECT erh.end_date::date 
   FROM equipment_rental_history erh 
   WHERE erh.rental_id = ri.rental_id 
     AND erh.equipment_id = ri.equipment_id 
     AND erh.status = 'completed'
   LIMIT 1),
  ri.updated_at::date
)
WHERE ri.status = 'completed' 
  AND ri.completed_date IS NULL;

-- Show summary of what was updated
SELECT 
  COUNT(*) as total_completed_items,
  COUNT(CASE WHEN completed_date IS NOT NULL THEN 1 END) as items_with_completed_date,
  COUNT(CASE WHEN completed_date IS NULL THEN 1 END) as items_missing_completed_date
FROM rental_items
WHERE status = 'completed';

