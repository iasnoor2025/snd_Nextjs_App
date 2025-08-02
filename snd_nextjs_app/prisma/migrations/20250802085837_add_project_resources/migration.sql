-- CreateTable
CREATE TABLE "project_resources" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER,
    "unit_cost" DECIMAL(10,2),
    "total_cost" DECIMAL(10,2),
    "date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "employee_id" INTEGER,
    "worker_name" TEXT,
    "job_title" TEXT,
    "daily_rate" DECIMAL(10,2),
    "days_worked" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "total_days" INTEGER,
    "equipment_id" INTEGER,
    "equipment_name" TEXT,
    "operator_name" TEXT,
    "hourly_rate" DECIMAL(10,2),
    "hours_worked" DECIMAL(10,2),
    "usage_hours" DECIMAL(10,2),
    "maintenance_cost" DECIMAL(10,2),
    "material_name" TEXT,
    "unit" TEXT,
    "unit_price" DECIMAL(10,2),
    "material_id" INTEGER,
    "fuel_type" TEXT,
    "liters" DECIMAL(10,2),
    "price_per_liter" DECIMAL(10,2),
    "category" TEXT,
    "expense_description" TEXT,
    "amount" DECIMAL(10,2),
    "title" TEXT,
    "priority" TEXT,
    "due_date" TIMESTAMP(3),
    "completion_percentage" INTEGER,
    "assigned_to_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_resources_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
