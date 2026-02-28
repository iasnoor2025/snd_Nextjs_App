-- Petty cash accounts (company petty cash boxes)
CREATE TABLE IF NOT EXISTS "petty_cash_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "company_id" integer,
  "location_id" integer,
  "currency" text DEFAULT 'SAR' NOT NULL,
  "opening_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" integer,
  "created_at" date DEFAULT CURRENT_DATE NOT NULL,
  "updated_at" date NOT NULL
);

-- Petty cash transactions (IN / OUT / EXPENSE / ADJUSTMENT)
CREATE TABLE IF NOT EXISTS "petty_cash_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "account_id" integer NOT NULL,
  "transaction_date" date NOT NULL,
  "type" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "description" text,
  "reference" text,
  "receipt_number" text,
  "expense_category_id" integer,
  "project_id" integer,
  "employee_id" integer,
  "created_by" integer,
  "approved_by" integer,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" date DEFAULT CURRENT_DATE NOT NULL,
  "updated_at" date NOT NULL
);

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "petty_cash_accounts" ADD CONSTRAINT "petty_cash_accounts_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "petty_cash_accounts" ADD CONSTRAINT "petty_cash_accounts_location_id_fkey"
    FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "petty_cash_accounts" ADD CONSTRAINT "petty_cash_accounts_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "public"."petty_cash_accounts"("id") ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_expense_category_id_fkey"
    FOREIGN KEY ("expense_category_id") REFERENCES "public"."expense_categories"("id") ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "petty_cash_transactions" ADD CONSTRAINT "petty_cash_transactions_approved_by_fkey"
    FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
