-- Remove quantity and days fields from rental_items table
ALTER TABLE "rental_items" DROP COLUMN "quantity";
ALTER TABLE "rental_items" DROP COLUMN "days";
