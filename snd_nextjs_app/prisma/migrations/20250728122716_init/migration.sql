-- CreateTable
CREATE TABLE "employees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "file_number" TEXT NOT NULL,
    "basic_salary" REAL NOT NULL,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "email" TEXT,
    "phone" TEXT,
    "hire_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employee_id" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "base_salary" REAL NOT NULL,
    "overtime_amount" REAL NOT NULL DEFAULT 0,
    "bonus_amount" REAL NOT NULL DEFAULT 0,
    "deduction_amount" REAL NOT NULL DEFAULT 0,
    "advance_deduction" REAL NOT NULL DEFAULT 0,
    "final_amount" REAL NOT NULL,
    "total_worked_hours" REAL NOT NULL DEFAULT 160,
    "overtime_hours" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "approved_by" INTEGER,
    "approved_at" DATETIME,
    "paid_by" INTEGER,
    "paid_at" DATETIME,
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "payment_status" TEXT,
    "payment_processed_at" DATETIME,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "payroll_run_id" INTEGER,
    CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payrolls_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "payroll_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "tax_rate" REAL NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payrolls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batch_id" TEXT NOT NULL,
    "run_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "run_by" INTEGER NOT NULL,
    "total_employees" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employee_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "hours_worked" REAL NOT NULL,
    "overtime_hours" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "notes" TEXT,
    "approved_by" INTEGER,
    "approved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_file_number_key" ON "employees"("file_number");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_employee_id_month_year_key" ON "payrolls"("employee_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_batch_id_key" ON "payroll_runs"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "timesheets_employee_id_date_key" ON "timesheets"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
