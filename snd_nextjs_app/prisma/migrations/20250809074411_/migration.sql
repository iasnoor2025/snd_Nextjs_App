-- CreateTable
CREATE TABLE "public"."equipment_maintenance_items" (
    "id" SERIAL NOT NULL,
    "maintenance_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unit_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_maintenance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipment_maintenance_labor" (
    "id" SERIAL NOT NULL,
    "maintenance_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_maintenance_labor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."equipment_maintenance_items" ADD CONSTRAINT "equipment_maintenance_items_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "public"."equipment_maintenance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment_maintenance_labor" ADD CONSTRAINT "equipment_maintenance_labor_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "public"."equipment_maintenance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment_maintenance_labor" ADD CONSTRAINT "equipment_maintenance_labor_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
