-- AlterTable
ALTER TABLE "employee_assignments" ADD COLUMN     "location" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'manual';
