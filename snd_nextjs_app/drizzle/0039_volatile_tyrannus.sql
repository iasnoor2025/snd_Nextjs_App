CREATE TABLE "expense_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"description" text,
	"created_at" date DEFAULT CURRENT_DATE NOT NULL,
	"updated_at" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_name_key" ON "expense_categories" USING btree ("name" text_ops);