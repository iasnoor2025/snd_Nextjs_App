-- CreateTable
CREATE TABLE "equipment_rental_history" (
    "id" SERIAL NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "rental_id" INTEGER,
    "project_id" INTEGER,
    "employee_id" INTEGER,
    "assignment_type" TEXT NOT NULL DEFAULT 'rental',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "daily_rate" DECIMAL(10,2),
    "total_amount" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_rental_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "equipment_rental_history" ADD CONSTRAINT "equipment_rental_history_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rental_history" ADD CONSTRAINT "equipment_rental_history_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rental_history" ADD CONSTRAINT "equipment_rental_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rental_history" ADD CONSTRAINT "equipment_rental_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
