-- CreateTable
CREATE TABLE "advance_payment_histories" (
    "id" SERIAL NOT NULL,
    "advance_payment_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "recorded_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "advance_payment_histories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "advance_payment_histories" ADD CONSTRAINT "advance_payment_histories_advance_payment_id_fkey" FOREIGN KEY ("advance_payment_id") REFERENCES "advance_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_payment_histories" ADD CONSTRAINT "advance_payment_histories_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
