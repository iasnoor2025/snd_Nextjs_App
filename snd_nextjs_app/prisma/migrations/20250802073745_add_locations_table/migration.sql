/*
  Warnings:

  - You are about to drop the `equipment_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "equipment_assignments" DROP CONSTRAINT "equipment_assignments_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_assignments" DROP CONSTRAINT "equipment_assignments_equipment_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_assignments" DROP CONSTRAINT "equipment_assignments_project_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_assignments" DROP CONSTRAINT "equipment_assignments_rental_id_fkey";

-- DropTable
DROP TABLE "equipment_assignments";

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "country" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);
