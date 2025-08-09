/*
  Warnings:

  - You are about to drop the `equipment_maintenance_attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `equipment_maintenance_labor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `equipment_maintenance_tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."equipment_maintenance" DROP CONSTRAINT "equipment_maintenance_requested_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."equipment_maintenance_attachments" DROP CONSTRAINT "equipment_maintenance_attachments_maintenance_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."equipment_maintenance_labor" DROP CONSTRAINT "equipment_maintenance_labor_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."equipment_maintenance_labor" DROP CONSTRAINT "equipment_maintenance_labor_maintenance_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."equipment_maintenance_tasks" DROP CONSTRAINT "equipment_maintenance_tasks_maintenance_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."equipment_maintenance_tasks" DROP CONSTRAINT "equipment_maintenance_tasks_performed_by_id_fkey";

-- AlterTable
ALTER TABLE "public"."equipment_maintenance" ALTER COLUMN "title" SET DEFAULT 'Maintenance';

-- DropTable
DROP TABLE "public"."equipment_maintenance_attachments";

-- DropTable
DROP TABLE "public"."equipment_maintenance_labor";

-- DropTable
DROP TABLE "public"."equipment_maintenance_tasks";
