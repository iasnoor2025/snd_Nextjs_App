import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  foreignKey,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const analyticsReports = pgTable('analytics_reports', {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  type: text().notNull(),
  description: text(),
  status: text().default('active').notNull(),
  createdBy: text('created_by'),
  schedule: text(),
  parameters: text(),
  isActive: boolean('is_active').default(true).notNull(),
  lastGenerated: date('last_generated'),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
});

export const advancePaymentHistories = pgTable(
  'advance_payment_histories',
  {
    id: serial().primaryKey().notNull(),
    advancePaymentId: integer('advance_payment_id').notNull(),
    employeeId: integer('employee_id').notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    paymentDate: date('payment_date').notNull(),
    notes: text(),
    recordedBy: integer('recorded_by'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
  },
  table => [
    foreignKey({
      columns: [table.advancePaymentId],
      foreignColumns: [advancePayments.id],
      name: 'advance_payment_histories_advance_payment_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'advance_payment_histories_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const equipmentRentalHistory = pgTable(
  'equipment_rental_history',
  {
    id: serial().primaryKey().notNull(),
    equipmentId: integer('equipment_id').notNull(),
    rentalId: integer('rental_id'),
    projectId: integer('project_id'),
    employeeId: integer('employee_id'),
    assignmentType: text('assignment_type').default('rental').notNull(),
    startDate: timestamp('start_date', { precision: 3, mode: 'string' }).notNull(),
    endDate: timestamp('end_date', { precision: 3, mode: 'string' }),
    status: text().default('active').notNull(),
    notes: text(),
    dailyRate: numeric('daily_rate', { precision: 10, scale: 2 }),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
  },
  table => [
    foreignKey({
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
      name: 'equipment_rental_history_equipment_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.rentalId],
      foreignColumns: [rentals.id],
      name: 'equipment_rental_history_rental_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'equipment_rental_history_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'equipment_rental_history_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const companyDocumentTypes = pgTable('company_document_types', {
  id: serial().primaryKey().notNull(),
  key: text().notNull().unique(),
  label: text().notNull(),
  description: text(),
  required: boolean().default(false).notNull(),
  category: text().default('general'),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
});

export const companies = pgTable('companies', {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  address: text(),
  email: text(),
  phone: text(),
  logo: text(),
  // Saudi Law Required Documents
  commercialRegistration: text('commercial_registration'),
  commercialRegistrationExpiry: date('commercial_registration_expiry'),
  taxRegistration: text('tax_registration'),
  taxRegistrationExpiry: date('tax_registration_expiry'),
  municipalityLicense: text('municipality_license'),
  municipalityLicenseExpiry: date('municipality_license_expiry'),
  chamberOfCommerce: text('chamber_of_commerce'),
  chamberOfCommerceExpiry: date('chamber_of_commerce_expiry'),
  laborOfficeLicense: text('labor_office_license'),
  laborOfficeLicenseExpiry: date('labor_office_license_expiry'),
  gosiRegistration: text('gosi_registration'),
  gosiRegistrationExpiry: date('gosi_registration_expiry'),
  saudiStandardsLicense: text('saudi_standards_license'),
  saudiStandardsLicenseExpiry: date('saudi_standards_license_expiry'),
  environmentalLicense: text('environmental_license'),
  environmentalLicenseExpiry: date('environmental_license_expiry'),
  // Additional Saudi Law Documents
  zakatRegistration: text('zakat_registration'),
  zakatRegistrationExpiry: date('zakat_registration_expiry'),
  saudiArabiaVisa: text('saudi_arabia_visa'),
  saudiArabiaVisaExpiry: date('saudi_arabia_visa_expiry'),
  investmentLicense: text('investment_license'),
  investmentLicenseExpiry: date('investment_license_expiry'),
  importExportLicense: text('import_export_license'),
  importExportLicenseExpiry: date('import_export_license_expiry'),
  pharmaceuticalLicense: text('pharmaceutical_license'),
  pharmaceuticalLicenseExpiry: date('pharmaceutical_license_expiry'),
  foodSafetyLicense: text('food_safety_license'),
  foodSafetyLicenseExpiry: date('food_safety_license_expiry'),
  constructionLicense: text('construction_license'),
  constructionLicenseExpiry: date('construction_license_expiry'),
  transportationLicense: text('transportation_license'),
  transportationLicenseExpiry: date('transportation_license_expiry'),
  bankingLicense: text('banking_license'),
  bankingLicenseExpiry: date('banking_license_expiry'),
  insuranceLicense: text('insurance_license'),
  insuranceLicenseExpiry: date('insurance_license_expiry'),
  telecomLicense: text('telecom_license'),
  telecomLicenseExpiry: date('telecom_license_expiry'),
  energyLicense: text('energy_license'),
  energyLicenseExpiry: date('energy_license_expiry'),
  miningLicense: text('mining_license'),
  miningLicenseExpiry: date('mining_license_expiry'),
  tourismLicense: text('tourism_license'),
  tourismLicenseExpiry: date('tourism_license_expiry'),
  educationLicense: text('education_license'),
  educationLicenseExpiry: date('education_license_expiry'),
  healthcareLicense: text('healthcare_license'),
  healthcareLicenseExpiry: date('healthcare_license_expiry'),
  realEstateLicense: text('real_estate_license'),
  realEstateLicenseExpiry: date('real_estate_license_expiry'),
  legalServicesLicense: text('legal_services_license'),
  legalServicesLicenseExpiry: date('legal_services_license_expiry'),
  accountingLicense: text('accounting_license'),
  accountingLicenseExpiry: date('accounting_license_expiry'),
  advertisingLicense: text('advertising_license'),
  advertisingLicenseExpiry: date('advertising_license_expiry'),
  mediaLicense: text('media_license'),
  mediaLicenseExpiry: date('media_license_expiry'),
  securityLicense: text('security_license'),
  securityLicenseExpiry: date('security_license_expiry'),
  cleaningLicense: text('cleaning_license'),
  cleaningLicenseExpiry: date('cleaning_license_expiry'),
  cateringLicense: text('catering_license'),
  cateringLicenseExpiry: date('catering_license_expiry'),
  warehouseLicense: text('warehouse_license'),
  warehouseLicenseExpiry: date('warehouse_license_expiry'),
  logisticsLicense: text('logistics_license'),
  logisticsLicenseExpiry: date('logistics_license_expiry'),
  maintenanceLicense: text('maintenance_license'),
  maintenanceLicenseExpiry: date('maintenance_license_expiry'),
  trainingLicense: text('training_license'),
  trainingLicenseExpiry: date('training_license_expiry'),
  consultingLicense: text('consulting_license'),
  consultingLicenseExpiry: date('consulting_license_expiry'),
  researchLicense: text('research_license'),
  researchLicenseExpiry: date('research_license_expiry'),
  technologyLicense: text('technology_license'),
  technologyLicenseExpiry: date('technology_license_expiry'),
  innovationLicense: text('innovation_license'),
  innovationLicenseExpiry: date('innovation_license_expiry'),
  // Additional Company Information
  website: text(),
  contactPerson: text('contact_person'),
  contactPersonPhone: text('contact_person_phone'),
  contactPersonEmail: text('contact_person_email'),
  companyType: text('company_type'),
  industry: text(),
  employeeCount: integer('employee_count'),
  // Legacy field for backward compatibility
  legalDocument: text('legal_document'),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
  deletedAt: date('deleted_at'),
});

export const employeeAssignments = pgTable(
  'employee_assignments',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    projectId: integer('project_id'),
    rentalId: integer('rental_id'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    status: text().default('active').notNull(),
    notes: text(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    location: text(),
    name: text(),
    type: text().default('manual').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_assignments_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'employee_assignments_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.rentalId],
      foreignColumns: [rentals.id],
      name: 'employee_assignments_rental_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const locations = pgTable('locations', {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  address: text(),
  city: text(),
  state: text(),
  zipCode: text('zip_code'),
  country: text(),
  latitude: numeric({ precision: 10, scale: 8 }),
  longitude: numeric({ precision: 11, scale: 8 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
});



export const prismaMigrations = pgTable('_prisma_migrations', {
  id: varchar({ length: 36 }).primaryKey().notNull(),
  checksum: varchar({ length: 64 }).notNull(),
  finishedAt: date('finished_at'),
  migrationName: varchar('migration_name', { length: 255 }).notNull(),
  logs: text(),
  rolledBackAt: date('rolled_back_at'),
  startedAt: date('started_at').defaultNow().notNull(),
  appliedStepsCount: integer('applied_steps_count').default(0).notNull(),
});

export const salaryIncrements = pgTable(
  'salary_increments',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    incrementType: text('increment_type').notNull(),
    effectiveDate: date('effective_date').notNull(),
    reason: text().notNull(),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    status: text().default('pending').notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    currentBaseSalary: numeric('current_base_salary', { precision: 10, scale: 2 }).notNull(),
    currentFoodAllowance: numeric('current_food_allowance', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    currentHousingAllowance: numeric('current_housing_allowance', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    currentTransportAllowance: numeric('current_transport_allowance', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    deletedAt: date('deleted_at'),
    incrementAmount: numeric('increment_amount', { precision: 10, scale: 2 }),
    incrementPercentage: numeric('increment_percentage', { precision: 5, scale: 2 }),
    newBaseSalary: numeric('new_base_salary', { precision: 10, scale: 2 }).notNull(),
    newFoodAllowance: numeric('new_food_allowance', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    newHousingAllowance: numeric('new_housing_allowance', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    newTransportAllowance: numeric('new_transport_allowance', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    notes: text(),
    rejectedAt: date('rejected_at'),
    rejectedBy: integer('rejected_by'),
    rejectionReason: text('rejection_reason'),
    requestedAt: date('requested_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    requestedBy: integer('requested_by').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.requestedBy],
      foreignColumns: [users.id],
      name: 'salary_increments_requested_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [users.id],
      name: 'salary_increments_approved_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.rejectedBy],
      foreignColumns: [users.id],
      name: 'salary_increments_rejected_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'salary_increments_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const equipmentMaintenance = pgTable(
  'equipment_maintenance',
  {
    id: serial().primaryKey().notNull(),
    equipmentId: integer('equipment_id').notNull(),
    title: text().default('Maintenance').notNull(),
    description: text(),
    status: text().default('open').notNull(),
    type: text().default('corrective').notNull(),
    priority: text().default('medium').notNull(),
    requestedBy: integer('requested_by'),
    assignedToEmployeeId: integer('assigned_to_employee_id'),
    scheduledDate: date('scheduled_date'),
    dueDate: date('due_date'),
    startedAt: date('started_at'),
    completedAt: date('completed_at'),
    cost: numeric({ precision: 12, scale: 2 }),
    meterReading: numeric('meter_reading', { precision: 12, scale: 2 }),
    notes: text(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
      name: 'equipment_maintenance_equipment_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.assignedToEmployeeId],
      foreignColumns: [employees.id],
      name: 'equipment_maintenance_assigned_to_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const advancePayments = pgTable(
  'advance_payments',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    purpose: text().notNull(),
    reason: text(),
    status: text().default('pending').notNull(),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    rejectedBy: integer('rejected_by'),
    rejectedAt: date('rejected_at'),
    rejectionReason: text('rejection_reason'),
    repaymentDate: date('repayment_date'),
    estimatedMonths: integer('estimated_months'),
    monthlyDeduction: numeric('monthly_deduction', { precision: 10, scale: 2 }),
    paymentDate: date('payment_date'),
    repaidAmount: numeric('repaid_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
    financeApprovalAt: date(),
    financeApprovalBy: integer(),
    financeApprovalNotes: text(),
    hrApprovalAt: date(),
    hrApprovalBy: integer(),
    hrApprovalNotes: text(),
    managerApprovalAt: date(),
    managerApprovalBy: integer(),
    managerApprovalNotes: text(),
    notes: text(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'advance_payments_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const equipmentMaintenanceItems = pgTable(
  'equipment_maintenance_items',
  {
    id: serial().primaryKey().notNull(),
    maintenanceId: integer('maintenance_id').notNull(),
    name: text().notNull(),
    description: text(),
    quantity: numeric({ precision: 10, scale: 2 }).default('1').notNull(),
    unit: text(),
    unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).default('0').notNull(),
    totalCost: numeric('total_cost', { precision: 12, scale: 2 }).default('0').notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.maintenanceId],
      foreignColumns: [equipmentMaintenance.id],
      name: 'equipment_maintenance_items_maintenance_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const geofenceZones = pgTable('geofence_zones', {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  latitude: numeric({ precision: 10, scale: 8 }).notNull(),
  longitude: numeric({ precision: 11, scale: 8 }).notNull(),
  radius: numeric({ precision: 8, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
});

export const media = pgTable('media', {
  id: serial().primaryKey().notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  disk: text().default('public').notNull(),
  collection: text(),
  modelType: text('model_type'),
  modelId: integer('model_id'),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  email: text().primaryKey().notNull(),
  token: text().notNull(),
  createdAt: date('created_at'),
  expiresAt: date('expires_at'),
});

export const sessions = pgTable('sessions', {
  id: text().primaryKey().notNull(),
  userId: integer('user_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  payload: text().notNull(),
  lastActivity: integer('last_activity').notNull(),
});

export const cache = pgTable('cache', {
  key: text().primaryKey().notNull(),
  value: text().notNull(),
  expiration: integer().notNull(),
});

export const jobs = pgTable('jobs', {
  id: serial().primaryKey().notNull(),
  queue: text().notNull(),
  payload: text().notNull(),
  attempts: integer().notNull(),
  reservedAt: integer('reserved_at'),
  availableAt: integer('available_at').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const failedJobs = pgTable(
  'failed_jobs',
  {
    id: serial().primaryKey().notNull(),
    uuid: text().notNull(),
    connection: text().notNull(),
    queue: text().notNull(),
    payload: text().notNull(),
    exception: text().notNull(),
    failedAt: date('failed_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
  },
  table => [
    uniqueIndex('failed_jobs_uuid_key').using('btree', table.uuid.asc().nullsLast().op('text_ops')),
  ]
);

export const personalAccessTokens = pgTable(
  'personal_access_tokens',
  {
    id: serial().primaryKey().notNull(),
    tokenableType: text('tokenable_type').notNull(),
    tokenableId: integer('tokenable_id').notNull(),
    name: text().notNull(),
    token: text().notNull(),
    abilities: text(),
    lastUsedAt: date('last_used_at'),
    expiresAt: date('expires_at'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    uniqueIndex('personal_access_tokens_token_key').using(
      'btree',
      table.token.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const telescopeEntries = pgTable(
  'telescope_entries',
  {
    sequence: integer().primaryKey().notNull(),
    uuid: text().notNull(),
    batchId: text('batch_id'),
    familyHash: text('family_hash'),
    shouldIndexOnDisplay: boolean('should_index_on_display').default(true).notNull(),
    type: text().notNull(),
    content: text().notNull(),
    occurredAt: date('occurred_at').notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
  },
  table => [
    uniqueIndex('telescope_entries_uuid_key').using(
      'btree',
      table.uuid.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const telescopeMonitoring = pgTable('telescope_monitoring', {
  tag: text().primaryKey().notNull(),
});

export const rentals = pgTable(
  'rentals',
  {
    id: serial().primaryKey().notNull(),
    customerId: integer('customer_id'),
    rentalNumber: text('rental_number').notNull(),
    projectId: integer('project_id'),
    startDate: date('start_date').notNull(),
    expectedEndDate: date('expected_end_date'),
    actualEndDate: date('actual_end_date'),
    status: text().default('pending').notNull(),
    subtotal: numeric({ precision: 12, scale: 2 }).default('0').notNull(),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0').notNull(),
    discount: numeric({ precision: 12, scale: 2 }).default('0').notNull(),
    tax: numeric({ precision: 12, scale: 2 }).default('0').notNull(),
    finalAmount: numeric('final_amount', { precision: 12, scale: 2 }).default('0').notNull(),
    paymentStatus: text('payment_status').default('pending').notNull(),
    notes: text(),
    createdBy: integer('created_by'),
    equipmentName: text('equipment_name'),
    description: text(),
    quotationId: integer('quotation_id'),
    mobilizationDate: date('mobilization_date'),
    invoiceDate: date('invoice_date'),
    depositAmount: numeric('deposit_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    paymentTermsDays: integer('payment_terms_days').default(30).notNull(),
    paymentDueDate: date('payment_due_date'),
    hasTimesheet: boolean('has_timesheet').default(false).notNull(),
    hasOperators: boolean('has_operators').default(false).notNull(),
    completedBy: integer('completed_by'),
    completedAt: date('completed_at'),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    depositPaid: boolean('deposit_paid').default(false).notNull(),
    depositPaidDate: date('deposit_paid_date'),
    depositRefunded: boolean('deposit_refunded').default(false).notNull(),
    depositRefundDate: date('deposit_refund_date'),
    invoiceId: text('invoice_id'),
    paymentId: text('payment_id'),
    lastPaymentDate: date('last_payment_date'),
    lastPaymentAmount: numeric('last_payment_amount', { precision: 12, scale: 2 }),
    outstandingAmount: numeric('outstanding_amount', { precision: 12, scale: 2 }).default('0').notNull(),
    lastInvoiceDate: date('last_invoice_date'),
    lastInvoiceId: text('last_invoice_id'),
    lastInvoiceAmount: numeric('last_invoice_amount', { precision: 12, scale: 2 }),
    locationId: integer('location_id'),
    supervisor: text('supervisor'),
    area: text('area'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
    deliveryTerms: text('delivery_terms'),
    shipmentTerms: text('shipment_terms'),
    rentalTerms: text('rental_terms'),
    paymentTerms: text('payment_terms'),
    additionalTerms: text('additional_terms'),
    mdTerms: text('md_terms'),
    termsLastUpdated: timestamp('terms_last_updated', { precision: 3, mode: 'string' }),
    termsUpdateNotes: text('terms_update_notes'),
  },
  table => [
    uniqueIndex('rentals_rental_number_key').using(
      'btree',
      table.rentalNumber.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: 'rentals_customer_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'rentals_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'rentals_created_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.completedBy],
      foreignColumns: [users.id],
      name: 'rentals_completed_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [users.id],
      name: 'rentals_approved_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const rentalInvoices = pgTable('rental_invoices', {
  id: serial().primaryKey().notNull(),
  rentalId: integer('rental_id').notNull(),
  invoiceId: text('invoice_id').notNull(),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
}, table => [
  foreignKey({
    columns: [table.rentalId],
    foreignColumns: [rentals.id],
  })
    .onUpdate('cascade')
    .onDelete('cascade'),
  uniqueIndex('rental_invoices_invoice_id_key').on(table.invoiceId),
]);

export const rentalPayments = pgTable('rental_payments', {
  id: serial().primaryKey().notNull(),
  rentalId: integer('rental_id').notNull(),
  paymentId: text('payment_id').notNull(),
  paymentDate: date('payment_date').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
}, table => [
  foreignKey({
    columns: [table.rentalId],
    foreignColumns: [rentals.id],
  })
    .onUpdate('cascade')
    .onDelete('cascade'),
  uniqueIndex('rental_payments_payment_id_key').on(table.paymentId),
]);

export const rentalTimesheetReceived = pgTable('rental_timesheet_received', {
  id: serial().primaryKey().notNull(),
  rentalId: integer('rental_id').notNull(),
  rentalItemId: integer('rental_item_id'), // Track per item, null means entire month
  month: text().notNull(), // Format: YYYY-MM
  received: boolean().default(false).notNull(),
  receivedBy: integer('received_by'),
  receivedAt: timestamp('received_at', { precision: 3, mode: 'string' }),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
}, table => [
  foreignKey({
    columns: [table.rentalId],
    foreignColumns: [rentals.id],
  })
    .onUpdate('cascade')
    .onDelete('cascade'),
  foreignKey({
    columns: [table.receivedBy],
    foreignColumns: [users.id],
  })
    .onUpdate('cascade')
    .onDelete('set null'),
  uniqueIndex('rental_timesheet_received_rental_item_month_key').on(
    table.rentalId,
    table.rentalItemId,
    table.month
  ),
]);

export const departments = pgTable('departments', {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  code: text(),
  description: text(),
  active: boolean().default(true).notNull(),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
  deletedAt: date('deleted_at'),
});

export const designations = pgTable(
  'designations',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    departmentId: integer('department_id'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
  },
  table => [
    foreignKey({
      columns: [table.departmentId],
      foreignColumns: [departments.id],
      name: 'designations_department_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const employeeDocuments = pgTable(
  'employee_documents',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    documentType: text('document_type').notNull(),
    filePath: text('file_path').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size'),
    mimeType: text('mime_type'),
    description: text(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at')
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_documents_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const employeeLeaves = pgTable(
  'employee_leaves',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    leaveType: text('leave_type').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    days: integer().notNull(),
    reason: text(),
    status: text().default('pending').notNull(),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    rejectedAt: date('rejected_at'),
    rejectedBy: integer('rejected_by'),
    rejectionReason: text('rejection_reason'),
    returnDate: date('return_date'),
    returnedBy: integer('returned_by'),
    returnReason: text('return_reason'),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_leaves_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const employeePerformanceReviews = pgTable(
  'employee_performance_reviews',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    reviewDate: date('review_date').notNull(),
    reviewerId: integer('reviewer_id'),
    rating: integer(),
    comments: text(),
    goals: text(),
    status: text().default('pending').notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_performance_reviews_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const employeeResignations = pgTable(
  'employee_resignations',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    resignationDate: date('resignation_date').notNull(),
    lastWorkingDate: date('last_working_date'),
    reason: text(),
    status: text().default('pending').notNull(),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_resignations_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const finalSettlements = pgTable(
  'final_settlements',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    resignationId: integer('resignation_id'),
    settlementNumber: text('settlement_number').notNull().unique(),
    
    // Settlement Type: 'vacation' or 'exit'
    settlementType: text('settlement_type').notNull().default('exit'), // 'vacation' | 'exit'
    
    // Employee Details
    employeeName: text('employee_name').notNull(),
    fileNumber: text('file_number'),
    iqamaNumber: text('iqama_number'),
    nationality: text('nationality'),
    designation: text('designation'),
    department: text('department'),
    hireDate: date('hire_date').notNull(),
    lastWorkingDate: date('last_working_date').notNull(),
    
    // Vacation specific fields
    vacationStartDate: date('vacation_start_date'),
    vacationEndDate: date('vacation_end_date'),
    expectedReturnDate: date('expected_return_date'),
    vacationDurationMonths: numeric('vacation_duration_months', { precision: 4, scale: 1 }),
    vacationDays: integer('vacation_days'),
    
    // Service Details
    totalServiceYears: integer('total_service_years').notNull(),
    totalServiceMonths: integer('total_service_months').notNull(),
    totalServiceDays: integer('total_service_days').notNull(),
    
    // Salary Information
    lastBasicSalary: numeric('last_basic_salary', { precision: 10, scale: 2 }).notNull(),
    lastAllowances: numeric('last_allowances', { precision: 10, scale: 2 }).default('0'),
    unpaidSalaryMonths: numeric('unpaid_salary_months', { precision: 4, scale: 1 }).default('0').notNull(),
    unpaidSalaryAmount: numeric('unpaid_salary_amount', { precision: 10, scale: 2 }).default('0'),
    
    // End of Service Benefits (Saudi Labor Law)
    endOfServiceBenefit: numeric('end_of_service_benefit', { precision: 10, scale: 2 }).notNull(),
    benefitCalculationMethod: text('benefit_calculation_method').notNull(), // 'resigned' or 'terminated'
    
    // Other Benefits
    accruedVacationDays: integer('accrued_vacation_days').default(0),
    accruedVacationAmount: numeric('accrued_vacation_amount', { precision: 10, scale: 2 }).default('0'),
    overtimeHours: numeric('overtime_hours', { precision: 8, scale: 2 }).default('0'),
    overtimeAmount: numeric('overtime_amount', { precision: 10, scale: 2 }).default('0'),
    otherBenefits: numeric('other_benefits', { precision: 10, scale: 2 }).default('0'),
    otherBenefitsDescription: text('other_benefits_description'),
    
    // Deductions
    pendingAdvances: numeric('pending_advances', { precision: 10, scale: 2 }).default('0'),
    equipmentDeductions: numeric('equipment_deductions', { precision: 10, scale: 2 }).default('0'),
    otherDeductions: numeric('other_deductions', { precision: 10, scale: 2 }).default('0'),
    otherDeductionsDescription: text('other_deductions_description'),
    
    // Absent Calculation
    absentDays: integer('absent_days').default(0),
    absentDeduction: numeric('absent_deduction', { precision: 10, scale: 2 }).default('0'),
    absentCalculationPeriod: text('absent_calculation_period'), // 'last_month', 'unpaid_period', 'custom'
    absentCalculationStartDate: date('absent_calculation_start_date'),
    absentCalculationEndDate: date('absent_calculation_end_date'),
    
    // Final Settlement
    grossAmount: numeric('gross_amount', { precision: 10, scale: 2 }).notNull(),
    totalDeductions: numeric('total_deductions', { precision: 10, scale: 2 }).notNull(),
    netAmount: numeric('net_amount', { precision: 10, scale: 2 }).notNull(),
    
    // Status and Approval
    status: text('status').default('draft').notNull(), // draft, pending_approval, approved, paid
    notes: text('notes'),
    
    // Approval Details
    preparedBy: integer('prepared_by').notNull(),
    preparedAt: date('prepared_at').default(sql`CURRENT_DATE`).notNull(),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    
    // Payment Details
    paidBy: integer('paid_by'),
    paidAt: date('paid_at'),
    paymentMethod: text('payment_method'),
    paymentReference: text('payment_reference'),
    
    // Document Details
    pdfPath: text('pdf_path'),
    employeeSignatureDate: date('employee_signature_date'),
    companySignatureDate: date('company_signature_date'),
    
    currency: text('currency').default('SAR').notNull(),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'final_settlements_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.resignationId],
      foreignColumns: [employeeResignations.id],
      name: 'final_settlements_resignation_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.preparedBy],
      foreignColumns: [users.id],
      name: 'final_settlements_prepared_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [users.id],
      name: 'final_settlements_approved_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.paidBy],
      foreignColumns: [users.id],
      name: 'final_settlements_paid_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const employeeSalaries = pgTable(
  'employee_salaries',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    basicSalary: numeric('basic_salary', { precision: 10, scale: 2 }).notNull(),
    allowances: numeric({ precision: 10, scale: 2 }).default('0').notNull(),
    deductions: numeric({ precision: 10, scale: 2 }).default('0').notNull(),
    effectiveDate: date('effective_date').notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_salaries_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const employeeSkill = pgTable(
  'employee_skill',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    skillId: integer('skill_id').notNull(),
    proficiencyLevel: text('proficiency_level'),
    certified: boolean().default(false).notNull(),
    certificationDate: date('certification_date'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    uniqueIndex('employee_skill_employee_id_skill_id_key').using(
      'btree',
      table.employeeId.asc().nullsLast().op('int4_ops'),
      table.skillId.asc().nullsLast().op('int4_ops')
    ),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_skill_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.skillId],
      foreignColumns: [skills.id],
      name: 'employee_skill_skill_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const employeeTraining = pgTable(
  'employee_training',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    trainingId: integer('training_id').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    status: text().default('planned').notNull(),
    certificate: text(),
    notes: text(),
    // H2S card specific fields
    cardNumber: text('card_number'), // e.g., "SND-0408"
    expiryDate: date('expiry_date'),
    trainerName: text('trainer_name'),
    trainerSignature: text('trainer_signature'), // URL to signature image
    qrCodeUrl: text('qr_code_url'), // URL to QR code image
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_training_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.trainingId],
      foreignColumns: [trainings.id],
      name: 'employee_training_training_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const employees = pgTable(
  'employees',
  {
    id: serial().primaryKey().notNull(),
    erpnextId: text('erpnext_id'),
    unitId: integer('unit_id'),
    fileNumber: text('file_number'),
    firstName: text('first_name').notNull(),
    middleName: text('middle_name'),
    lastName: text('last_name').notNull(),
    email: text(),
    phone: text(),
    address: text(),
    city: text(),
    state: text(),
    postalCode: text('postal_code'),
    country: text(),
    nationality: text(),
    dateOfBirth: date('date_of_birth'),
    hireDate: date('hire_date'),
    designationId: integer('designation_id'),
    departmentId: integer('department_id'),
    userId: integer('user_id'),
    supervisor: text(),
    hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
    basicSalary: numeric('basic_salary', { precision: 10, scale: 2 }).default('0').notNull(),
    foodAllowance: numeric('food_allowance', { precision: 10, scale: 2 }).default('0').notNull(),
    housingAllowance: numeric('housing_allowance', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    transportAllowance: numeric('transport_allowance', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    absentDeductionRate: numeric('absent_deduction_rate', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    overtimeRateMultiplier: numeric('overtime_rate_multiplier', { precision: 10, scale: 2 })
      .default('1.5')
      .notNull(),
    overtimeFixedRate: numeric('overtime_fixed_rate', { precision: 10, scale: 2 })
      .default('6')
      .notNull(),
    bankName: text('bank_name'),
    bankAccountNumber: text('bank_account_number'),
    bankIban: text('bank_iban'),
    contractHoursPerDay: integer('contract_hours_per_day').default(8).notNull(),
    contractDaysPerMonth: integer('contract_days_per_month').default(30).notNull(),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    emergencyContactRelationship: text('emergency_contact_relationship'),
    notes: text(),
    iqamaNumber: text('iqama_number'),
    iqamaExpiry: date('iqama_expiry'),
    iqamaCost: numeric('iqama_cost', { precision: 10, scale: 2 }),
    passportNumber: text('passport_number'),
    passportExpiry: date('passport_expiry'),
    drivingLicenseNumber: text('driving_license_number'),
    drivingLicenseExpiry: date('driving_license_expiry'),
    drivingLicenseCost: numeric('driving_license_cost', { precision: 10, scale: 2 }),
    operatorLicenseNumber: text('operator_license_number'),
    operatorLicenseExpiry: date('operator_license_expiry'),
    operatorLicenseCost: numeric('operator_license_cost', { precision: 10, scale: 2 }),
    tuvCertificationNumber: text('tuv_certification_number'),
    tuvCertificationExpiry: date('tuv_certification_expiry'),
    tuvCertificationCost: numeric('tuv_certification_cost', { precision: 10, scale: 2 }),
    spspLicenseNumber: text('spsp_license_number'),
    spspLicenseExpiry: date('spsp_license_expiry'),
    spspLicenseCost: numeric('spsp_license_cost', { precision: 10, scale: 2 }),
    drivingLicenseFile: text('driving_license_file'),
    operatorLicenseFile: text('operator_license_file'),
    tuvCertificationFile: text('tuv_certification_file'),
    spspLicenseFile: text('spsp_license_file'),
    passportFile: text('passport_file'),
    iqamaFile: text('iqama_file'),
    customCertifications: jsonb('custom_certifications'),
    isOperator: boolean('is_operator').default(false).notNull(),
    accessRestrictedUntil: date('access_restricted_until'),
    accessStartDate: date('access_start_date'),
    accessEndDate: date('access_end_date'),
    accessRestrictionReason: text('access_restriction_reason'),
    status: text().default('active').notNull(),
    currentLocation: text('current_location'),
    isExternal: boolean('is_external').default(false).notNull(),
    companyName: text('company_name'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
  },
  (table): any => [
    uniqueIndex('employees_file_number_key').using(
      'btree',
      table.fileNumber.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.designationId],
      foreignColumns: [designations.id],
      name: 'employees_designation_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.departmentId],
      foreignColumns: [departments.id],
      name: 'employees_department_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'employees_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.unitId],
      foreignColumns: [organizationalUnits.id],
      name: 'employees_unit_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const loans = pgTable(
  'loans',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    loanType: text('loan_type').notNull(),
    interestRate: numeric('interest_rate', { precision: 5, scale: 2 }),
    termMonths: integer('term_months').notNull(),
    monthlyPayment: numeric('monthly_payment', { precision: 10, scale: 2 }).notNull(),
    status: text().default('pending').notNull(),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    notes: text(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'loans_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const organizationalUnits = pgTable(
  'organizational_units',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    code: text().notNull(),
    type: text().notNull(),
    parentId: integer('parent_id'),
    managerId: integer('manager_id'),
    level: integer().default(0).notNull(),
    description: text(),
    metadata: jsonb(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
  },
  (table): any => [
    uniqueIndex('organizational_units_code_key').using(
      'btree',
      table.code.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: 'organizational_units_parent_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.managerId],
      foreignColumns: [employees.id],
      name: 'organizational_units_manager_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const payrollItems = pgTable(
  'payroll_items',
  {
    id: serial().primaryKey().notNull(),
    payrollId: integer('payroll_id').notNull(),
    type: text().notNull(),
    description: text().notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    order: integer().default(1).notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.payrollId],
      foreignColumns: [payrolls.id],
      name: 'payroll_items_payroll_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

export const payrollRuns = pgTable(
  'payroll_runs',
  {
    id: serial().primaryKey().notNull(),
    batchId: text('batch_id').notNull(),
    runDate: date('run_date').notNull(),
    status: text().default('pending').notNull(),
    runBy: integer('run_by').notNull(),
    totalEmployees: integer('total_employees').default(0).notNull(),
    notes: text(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    uniqueIndex('payroll_runs_batch_id_key').using(
      'btree',
      table.batchId.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const payrolls = pgTable(
  'payrolls',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    month: integer().notNull(),
    year: integer().notNull(),
    baseSalary: numeric('base_salary', { precision: 10, scale: 2 }).notNull(),
    overtimeAmount: numeric('overtime_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    bonusAmount: numeric('bonus_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    deductionAmount: numeric('deduction_amount', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    advanceDeduction: numeric('advance_deduction', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    finalAmount: numeric('final_amount', { precision: 10, scale: 2 }).notNull(),
    totalWorkedHours: numeric('total_worked_hours', { precision: 8, scale: 2 })
      .default('0')
      .notNull(),
    overtimeHours: numeric('overtime_hours', { precision: 8, scale: 2 }).default('0').notNull(),
    status: text().default('pending').notNull(),
    notes: text(),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    paidBy: integer('paid_by'),
    paidAt: date('paid_at'),
    paymentMethod: text('payment_method'),
    paymentReference: text('payment_reference'),
    paymentStatus: text('payment_status'),
    paymentProcessedAt: date('payment_processed_at'),
    currency: text().default('SAR').notNull(),
    payrollRunId: integer('payroll_run_id'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
  },
  table => [
    uniqueIndex('payrolls_employee_id_month_year_key').using(
      'btree',
      table.employeeId.asc().nullsLast().op('int4_ops'),
      table.month.asc().nullsLast().op('int4_ops'),
      table.year.asc().nullsLast().op('int4_ops')
    ),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'payrolls_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [users.id],
      name: 'payrolls_approved_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.paidBy],
      foreignColumns: [users.id],
      name: 'payrolls_paid_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.payrollRunId],
      foreignColumns: [payrollRuns.id],
      name: 'payrolls_payroll_run_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const projects = pgTable(
  'projects',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    customerId: integer('customer_id'),
    locationId: integer('location_id'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    status: text().default('active').notNull(),
    budget: numeric({ precision: 12, scale: 2 }),
    notes: text(),
    // Project team roles
    projectManagerId: integer('project_manager_id'),
    projectEngineerId: integer('project_engineer_id'),
    projectForemanId: integer('project_foreman_id'),
    supervisorId: integer('supervisor_id'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
  },
  table => [
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: 'projects_customer_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [locations.id],
      name: 'projects_location_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.projectManagerId],
      foreignColumns: [employees.id],
      name: 'projects_project_manager_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.projectEngineerId],
      foreignColumns: [employees.id],
      name: 'projects_project_engineer_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.projectForemanId],
      foreignColumns: [employees.id],
      name: 'projects_project_foreman_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.supervisorId],
      foreignColumns: [employees.id],
      name: 'projects_supervisor_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const skills = pgTable('skills', {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  category: text(),
  requiredLevel: text('required_level'),
  certificationRequired: boolean('certification_required').default(false),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
});


export const timesheets = pgTable(
  'timesheets',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    assignmentId: integer('assignment_id'),
    projectId: integer('project_id'),
    rentalId: integer('rental_id'),
    description: text(),
    date: date().notNull(),
    startTime: timestamp('start_time', { precision: 3, mode: 'string' }).notNull(),
    endTime: timestamp('end_time', { precision: 3, mode: 'string' }),
    hoursWorked: numeric('hours_worked', { precision: 5, scale: 2 }).default('0').notNull(),
    overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).default('0').notNull(),
    status: text().default('pending').notNull(),
    createdBy: integer('created_by'),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    notes: text(),
    rejectionReason: text('rejection_reason'),
    location: text(),
    project: text(),
    tasks: text(),
    submittedAt: timestamp('submitted_at', { precision: 3, mode: 'string' }),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
  },
  table => [
    uniqueIndex('timesheets_employee_id_date_key').using(
      'btree',
      table.employeeId.asc().nullsLast().op('int4_ops'),
      table.date.asc().nullsLast()
    ),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'timesheets_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.assignmentId],
      foreignColumns: [employeeAssignments.id],
      name: 'timesheets_assignment_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'timesheets_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.rentalId],
      foreignColumns: [rentals.id],
      name: 'timesheets_rental_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [users.id],
      name: 'timesheets_approved_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const trainings = pgTable('trainings', {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  category: text(),
  duration: text(),
  provider: text(),
  cost: numeric({ precision: 10, scale: 2 }),
  maxParticipants: integer('max_participants'),
  prerequisites: text(),
  objectives: text(),
  materials: text(),
  status: text().default('active').notNull(),
  createdAt: date('created_at')
    .default(sql`CURRENT_DATE`)
    .notNull(),
  updatedAt: date('updated_at').notNull(),
});

export const users = pgTable(
  'users',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    password: text().notNull(),
    nationalId: text('national_id'),
    emailVerifiedAt: date('email_verified_at'),
    provider: text(),
    providerId: text('provider_id'),
    rememberToken: text('remember_token'),
    roleId: integer('role_id').default(1).notNull(),
    status: integer().default(1).notNull(),
    isActive: boolean().default(true).notNull(),
    locale: text(),
    avatar: text(),
    lastLoginAt: date('last_login_at'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    uniqueIndex('users_email_key').using('btree', table.email.asc().nullsLast().op('text_ops')),
  ]
);

export const notifications = pgTable(
  'notifications',
  {
    id: serial().primaryKey().notNull(),
    userId: integer('user_id'),
    userEmail: text('user_email').notNull(),
    type: text().default('info').notNull(), // info, success, warning, error
    title: text().notNull(),
    message: text().notNull(),
    data: jsonb(),
    actionUrl: text('action_url'),
    priority: text().default('medium').notNull(), // low, medium, high
    read: boolean().default(false).notNull(),
    readAt: timestamp('read_at', { precision: 3, mode: 'string' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'notifications_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

export const conversations = pgTable(
  'conversations',
  {
    id: serial().primaryKey().notNull(),
    type: text().default('direct').notNull(), // 'direct' or 'group'
    name: text(), // For group chats
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
    lastMessageAt: timestamp('last_message_at', { precision: 3, mode: 'string' }),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'conversations_created_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    id: serial().primaryKey().notNull(),
    conversationId: integer('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    lastReadAt: timestamp('last_read_at', { precision: 3, mode: 'string' }),
    isMuted: boolean('is_muted').default(false).notNull(),
  },
  table => [
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [conversations.id],
      name: 'conversation_participants_conversation_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'conversation_participants_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

export const messages = pgTable(
  'messages',
  {
    id: serial().primaryKey().notNull(),
    conversationId: integer('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: integer('sender_id')
      .notNull()
      .references(() => users.id),
    content: text().notNull(),
    messageType: text('message_type').default('text').notNull(), // 'text', 'image', 'file', 'system'
    fileUrl: text('file_url'),
    fileName: text('file_name'),
    fileSize: integer('file_size'),
    replyToId: integer('reply_to_id').references(() => messages.id),
    isEdited: boolean('is_edited').default(false).notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at', { precision: 3, mode: 'string' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' }).notNull(),
  },
  table => [
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [conversations.id],
      name: 'messages_conversation_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.senderId],
      foreignColumns: [users.id],
      name: 'messages_sender_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.replyToId],
      foreignColumns: [messages.id],
      name: 'messages_reply_to_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const messageReads = pgTable(
  'message_reads',
  {
    id: serial().primaryKey().notNull(),
    messageId: integer('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at', { precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.messageId],
      foreignColumns: [messages.id],
      name: 'message_reads_message_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'message_reads_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

export const timeEntries = pgTable(
  'time_entries',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    timesheetId: integer('timesheet_id').notNull(),
    startTime: timestamp('start_time', { precision: 3, mode: 'string' }).notNull(),
    endTime: timestamp('end_time', { precision: 3, mode: 'string' }),
    hours: numeric({ precision: 5, scale: 2 }).notNull(),
    description: text(),
    location: text(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'time_entries_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.timesheetId],
      foreignColumns: [timesheets.id],
      name: 'time_entries_timesheet_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const customers = pgTable(
  'customers',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    contactPerson: text('contact_person'),
    email: text(),
    phone: text(),
    address: text(),
    city: text(),
    state: text(),
    postalCode: text('postal_code'),
    zip: text(),
    country: text(),
    website: text(),
    taxId: text('tax_id'),
    paymentTerms: text('payment_terms'),
    taxNumber: text('tax_number'),
    vatNumber: text('vat_number'),
    creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }),
    creditLimitUsed: numeric('credit_limit_used', { precision: 12, scale: 2 }),
    creditLimitRemaining: numeric('credit_limit_remaining', { precision: 12, scale: 2 }),
    currentDue: numeric('current_due', { precision: 12, scale: 2 }),
    totalValue: numeric('total_value', { precision: 12, scale: 2 }),
    outstandingAmount: numeric('outstanding_amount', { precision: 12, scale: 2 }),
    currency: text().default('SAR'),
    customerType: text('customer_type'),
    customerGroup: text('customer_group'),
    territory: text(),
    salesPerson: text('sales_person'),
    defaultPriceList: text('default_price_list'),
    defaultCurrency: text('default_currency').default('SAR'),
    language: text().default('en'),
    isActive: boolean('is_active').default(true).notNull(),
    status: text().default('active').notNull(),
    notes: text(),
    remarks: text(),
    userId: integer('user_id'),
    erpnextId: text('erpnext_id'),
    companyName: text('company_name'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
  },
  table => [
    uniqueIndex('customers_erpnext_id_key').using(
      'btree',
      table.erpnextId.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'customers_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const customerDocuments = pgTable(
  'customer_documents',
  {
    id: serial().primaryKey().notNull(),
    customerId: integer('customer_id').notNull(),
    documentType: text('document_type').notNull(),
    filePath: text('file_path').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size'),
    mimeType: text('mime_type'),
    description: text(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: 'customer_documents_customer_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const equipment = pgTable(
  'equipment',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    categoryId: integer('category_id'),
    manufacturer: text(),
    modelNumber: text('model_number'),
    serialNumber: text('serial_number'),
    chassisNumber: text('chassis_number'),
    purchaseDate: date('purchase_date'),
    purchasePrice: numeric('purchase_price', { precision: 12, scale: 2 }),
    warrantyExpiryDate: date('warranty_expiry_date'),
    status: text().default('available').notNull(),
    locationId: integer('location_id'),
    assignedTo: integer('assigned_to'),
    lastMaintenanceDate: date('last_maintenance_date'),
    nextMaintenanceDate: date('next_maintenance_date'),
    notes: text(),
    unit: text(),
    defaultUnitCost: numeric('default_unit_cost', { precision: 12, scale: 2 }),
    isActive: boolean('is_active').default(true).notNull(),
    dailyRate: numeric('daily_rate', { precision: 12, scale: 2 }),
    weeklyRate: numeric('weekly_rate', { precision: 12, scale: 2 }),
    monthlyRate: numeric('monthly_rate', { precision: 12, scale: 2 }),
    erpnextId: text('erpnext_id'),
    doorNumber: text('door_number'),
    currentOperatingHours: numeric('current_operating_hours', { precision: 10, scale: 2 }),
    currentMileage: numeric('current_mileage', { precision: 10, scale: 2 }),
    currentCycleCount: integer('current_cycle_count'),
    initialOperatingHours: numeric('initial_operating_hours', { precision: 10, scale: 2 }),
    initialMileage: numeric('initial_mileage', { precision: 10, scale: 2 }),
    initialCycleCount: integer('initial_cycle_count'),
    lastMetricUpdate: date('last_metric_update'),
    avgDailyUsageHours: numeric('avg_daily_usage_hours', { precision: 10, scale: 2 }),
    avgDailyUsageMiles: numeric('avg_daily_usage_miles', { precision: 10, scale: 2 }),
    avgOperatingCostPerHour: numeric('avg_operating_cost_per_hour', { precision: 10, scale: 2 }),
    avgOperatingCostPerMile: numeric('avg_operating_cost_per_mile', { precision: 10, scale: 2 }),
    lifetimeMaintenanceCost: numeric('lifetime_maintenance_cost', { precision: 15, scale: 2 }),
    efficiencyRating: numeric('efficiency_rating', { precision: 5, scale: 2 }),
    nextPerformanceReview: date('next_performance_review'),
    currentUtilizationRate: numeric('current_utilization_rate', { precision: 5, scale: 2 }),
    avgDailyUtilization: numeric('avg_daily_utilization', { precision: 5, scale: 2 }),
    avgWeeklyUtilization: numeric('avg_weekly_utilization', { precision: 5, scale: 2 }),
    avgMonthlyUtilization: numeric('avg_monthly_utilization', { precision: 5, scale: 2 }),
    idlePeriodsCount: integer('idle_periods_count'),
    totalIdleDays: integer('total_idle_days'),
    lastUtilizationUpdate: date('last_utilization_update'),
    optimalUtilizationTarget: numeric('optimal_utilization_target', { precision: 5, scale: 2 }),
    utilizationCostImpact: numeric('utilization_cost_impact', { precision: 10, scale: 2 }),
    purchaseCost: numeric('purchase_cost', { precision: 12, scale: 2 }),
    depreciatedValue: numeric('depreciated_value', { precision: 12, scale: 2 }),
    depreciationRate: numeric('depreciation_rate', { precision: 8, scale: 4 }),
    lastDepreciationUpdate: date('last_depreciation_update'),
    expectedReplacementDate: date('expected_replacement_date'),
    isFullyDepreciated: boolean('is_fully_depreciated').default(false).notNull(),
    replacementCostEstimate: numeric('replacement_cost_estimate', { precision: 12, scale: 2 }),
    valueAppreciation: numeric('value_appreciation', { precision: 12, scale: 2 }),
    assetCondition: text('asset_condition'),
    supplierId: integer('supplier_id'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
    istimara: text(),
    istimaraExpiryDate: date('istimara_expiry_date'),
    insurance: text(),
    insuranceExpiryDate: date('insurance_expiry_date'),
    tuvCard: text('tuv_card'),
    tuvCardExpiryDate: date('tuv_card_expiry_date'),
    gpsInstallDate: date('gps_install_date'),
    gpsExpiryDate: date('gps_expiry_date'),
    periodicExaminationDate: date('periodic_examination_date'),
    periodicExaminationExpiryDate: date('periodic_examination_expiry_date'),
  },
  table => [
    uniqueIndex('equipment_door_number_key').using(
      'btree',
      table.doorNumber.asc().nullsLast().op('text_ops')
    ),
    uniqueIndex('equipment_erpnext_id_key').using(
      'btree',
      table.erpnextId.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.assignedTo],
      foreignColumns: [employees.id],
      name: 'equipment_assigned_to_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const equipmentCategories = pgTable(
  'equipment_categories',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    icon: text(),
    color: text(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    uniqueIndex('equipment_categories_name_key').using(
      'btree',
      table.name.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const equipmentDocuments = pgTable(
  'equipment_documents',
  {
    id: serial().primaryKey().notNull(),
    equipmentId: integer('equipment_id').notNull(),
    documentType: text('document_type').notNull(),
    filePath: text('file_path').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size'),
    mimeType: text('mime_type'),
    description: text(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at')
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
      name: 'equipment_documents_equipment_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const permissions = pgTable(
  'permissions',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    guardName: text('guard_name').default('web').notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    uniqueIndex('permissions_name_key').using('btree', table.name.asc().nullsLast().op('text_ops')),
  ]
);

export const rentalItems = pgTable(
  'rental_items',
  {
    id: serial().primaryKey().notNull(),
    rentalId: integer('rental_id').notNull(),
    equipmentId: integer('equipment_id'),
    equipmentName: text('equipment_name'),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
    rateType: text('rate_type').default('daily').notNull(),
    operatorId: integer('operator_id'),
    supervisorId: integer('supervisor_id'),
    status: text().default('active').notNull(),
    notes: text(),
    startDate: date('start_date'), // Start date for individual rental items
    completedDate: date('completed_date'), // Completion date for rental items
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.rentalId],
      foreignColumns: [rentals.id],
      name: 'rental_items_rental_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
      name: 'rental_items_equipment_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const rentalEquipmentTimesheets = pgTable(
  'rental_equipment_timesheets',
  {
    id: serial().primaryKey().notNull(),
    rentalItemId: integer('rental_item_id').notNull(),
    rentalId: integer('rental_id').notNull(),
    equipmentId: integer('equipment_id'),
    date: date().notNull(),
    regularHours: numeric('regular_hours', { precision: 5, scale: 2 }).default('0').notNull(),
    overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).default('0').notNull(),
    notes: text(),
    createdBy: integer('created_by'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.rentalItemId],
      foreignColumns: [rentalItems.id],
      name: 'rental_equipment_timesheets_rental_item_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.rentalId],
      foreignColumns: [rentals.id],
      name: 'rental_equipment_timesheets_rental_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
      name: 'rental_equipment_timesheets_equipment_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    uniqueIndex('rental_equipment_timesheets_rental_item_date_key').on(
      table.rentalItemId,
      table.date
    ),
  ]
);

export const roles = pgTable(
  'roles',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    guardName: text('guard_name').default('web').notNull(),
    priority: integer().default(999).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    uniqueIndex('roles_name_key').using('btree', table.name.asc().nullsLast().op('text_ops')),
  ]
);

export const timeOffRequests = pgTable(
  'time_off_requests',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    leaveType: text('leave_type').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    days: integer().notNull(),
    reason: text(),
    status: text().default('pending').notNull(),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'time_off_requests_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const timesheetApprovals = pgTable(
  'timesheet_approvals',
  {
    id: serial().primaryKey().notNull(),
    timesheetId: integer('timesheet_id').notNull(),
    approverId: integer('approver_id').notNull(),
    status: text().notNull(),
    comments: text(),
    approvedAt: date('approved_at').notNull(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.timesheetId],
      foreignColumns: [timesheets.id],
      name: 'timesheet_approvals_timesheet_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const weeklyTimesheets = pgTable(
  'weekly_timesheets',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    weekStart: date('week_start').notNull(),
    weekEnd: date('week_end').notNull(),
    totalHours: numeric('total_hours', { precision: 8, scale: 2 }).notNull(),
    overtimeHours: numeric('overtime_hours', { precision: 8, scale: 2 }).notNull(),
    status: text().default('pending').notNull(),
    approvedBy: integer('approved_by'),
    approvedAt: date('approved_at'),
    notes: text(),
    createdAt: date('created_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'weekly_timesheets_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const telescopeEntryTags = pgTable(
  'telescope_entry_tags',
  {
    entryUuid: text('entry_uuid').notNull(),
    tag: text().notNull(),
  },
  table => [
    primaryKey({ columns: [table.entryUuid, table.tag], name: 'telescope_entry_tags_pkey' }),
  ]
);

export const modelHasRoles = pgTable(
  'model_has_roles',
  {
    roleId: integer('role_id').notNull(),
    userId: integer('user_id').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [roles.id],
      name: 'model_has_roles_role_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'model_has_roles_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({ columns: [table.roleId, table.userId], name: 'model_has_roles_pkey' }),
  ]
);

export const roleHasPermissions = pgTable(
  'role_has_permissions',
  {
    permissionId: integer('permission_id').notNull(),
    roleId: integer('role_id').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.permissionId],
      foreignColumns: [permissions.id],
      name: 'role_has_permissions_permission_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [roles.id],
      name: 'role_has_permissions_role_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({ columns: [table.permissionId, table.roleId], name: 'role_has_permissions_pkey' }),
  ]
);

export const modelHasPermissions = pgTable(
  'model_has_permissions',
  {
    permissionId: integer('permission_id').notNull(),
    userId: integer('user_id').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.permissionId],
      foreignColumns: [permissions.id],
      name: 'model_has_permissions_permission_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'model_has_permissions_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({ columns: [table.permissionId, table.userId], name: 'model_has_permissions_pkey' }),
  ]
);

// New missing tables

export const projectTasks = pgTable(
  'project_tasks',
  {
    id: serial().primaryKey().notNull(),
    projectId: integer('project_id').notNull(),
    name: text().notNull(),
    description: text(),
    status: text().default('pending').notNull(),
    priority: text().default('medium').notNull(),
    assignedToId: integer('assigned_to_id'),
    startDate: date('start_date'),
    dueDate: date('due_date'),
    completionPercentage: integer('completion_percentage').default(0).notNull(),
    estimatedHours: numeric('estimated_hours', { precision: 8, scale: 2 }),
    actualHours: numeric('actual_hours', { precision: 8, scale: 2 }),
    parentTaskId: integer('parent_task_id'),
    order: integer().default(0).notNull(),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
    deletedAt: date('deleted_at'),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'project_tasks_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.assignedToId],
      foreignColumns: [employees.id],
      name: 'project_tasks_assigned_to_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.parentTaskId],
      foreignColumns: [table.id],
      name: 'project_tasks_parent_task_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const projectMilestones = pgTable(
  'project_milestones',
  {
    id: serial().primaryKey().notNull(),
    projectId: integer('project_id').notNull(),
    name: text().notNull(),
    description: text(),
    dueDate: date('due_date').notNull(),
    status: text().default('pending').notNull(),
    completionDate: date('completion_date'),
    order: integer().default(0).notNull(),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'project_milestones_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

export const projectTemplates = pgTable(
  'project_templates',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    category: text().notNull(),
    estimatedDuration: integer('estimated_duration'),
    estimatedBudget: numeric('estimated_budget', { precision: 12, scale: 2 }),
    complexity: text().default('medium').notNull(),
    teamSize: integer('team_size'),
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: integer('created_by'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'project_templates_created_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const projectRisks = pgTable(
  'project_risks',
  {
    id: serial().primaryKey().notNull(),
    projectId: integer('project_id').notNull(),
    title: text().notNull(),
    description: text(),
    probability: text().default('medium').notNull(),
    impact: text().default('medium').notNull(),
    severity: text().default('medium').notNull(),
    status: text().default('open').notNull(),
    mitigationStrategy: text('mitigation_strategy'),
    assignedToId: integer('assigned_to_id'),
    dueDate: date('due_date'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'project_risks_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.assignedToId],
      foreignColumns: [employees.id],
      name: 'project_risks_assigned_to_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const systemSettings = pgTable(
  'system_settings',
  {
    id: serial().primaryKey().notNull(),
    key: text().notNull(),
    value: text(),
    type: text().default('string').notNull(),
    description: text(),
    isPublic: boolean('is_public').default(false).notNull(),
    category: text().default('general').notNull(),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    uniqueIndex('system_settings_key_key').using('btree', table.key.asc().nullsLast().op('text_ops')),
  ]
);

export const reportTemplates = pgTable(
  'report_templates',
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    type: text().notNull(),
    parameters: jsonb(),
    query: text(),
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: integer('created_by'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'report_templates_created_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const scheduledReports = pgTable(
  'scheduled_reports',
  {
    id: serial().primaryKey().notNull(),
    reportTemplateId: integer('report_template_id').notNull(),
    name: text().notNull(),
    schedule: text().notNull(),
    parameters: jsonb(),
    recipients: jsonb(),
    isActive: boolean('is_active').default(true).notNull(),
    lastRun: date('last_run'),
    nextRun: date('next_run'),
    createdBy: integer('created_by'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.reportTemplateId],
      foreignColumns: [reportTemplates.id],
      name: 'scheduled_reports_report_template_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'scheduled_reports_created_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const safetyIncidents = pgTable(
  'safety_incidents',
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    severity: text().default('medium').notNull(),
    status: text().default('open').notNull(),
    reportedBy: integer('reported_by').notNull(),
    assignedToId: integer('assigned_to_id'),
    location: text(),
    incidentDate: date('incident_date').notNull(),
    resolvedDate: date('resolved_date'),
    resolution: text(),
    cost: numeric('cost', { precision: 12, scale: 2 }),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.reportedBy],
      foreignColumns: [employees.id],
      name: 'safety_incidents_reported_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.assignedToId],
      foreignColumns: [employees.id],
      name: 'safety_incidents_assigned_to_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const documentVersions = pgTable(
  'document_versions',
  {
    id: serial().primaryKey().notNull(),
    documentId: integer('document_id').notNull(),
    version: integer().notNull(),
    filePath: text('file_path').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: text('mime_type').notNull(),
    uploadedBy: integer('uploaded_by').notNull(),
    changeNotes: text('change_notes'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
  },
  table => [
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [employeeDocuments.id],
      name: 'document_versions_document_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [users.id],
      name: 'document_versions_uploaded_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

export const documentApprovals = pgTable(
  'document_approvals',
  {
    id: serial().primaryKey().notNull(),
    documentId: integer('document_id').notNull(),
    approverId: integer('approver_id').notNull(),
    status: text().default('pending').notNull(),
    comments: text(),
    approvedAt: date('approved_at'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [employeeDocuments.id],
      name: 'document_approvals_document_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.approverId],
      foreignColumns: [users.id],
      name: 'document_approvals_approver_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
);

// Project Resource Tables - Separated by type for better organization

export const projectManpower = pgTable(
  'project_manpower',
  {
    id: serial('id').primaryKey().notNull(),
    projectId: integer('project_id').notNull().references(() => projects.id),
    employeeId: integer('employee_id').references(() => employees.id), // Made nullable
    workerName: text('worker_name'), // Added worker_name field
    jobTitle: text('job_title').notNull(),
    dailyRate: numeric('daily_rate', { precision: 10, scale: 2 }).default('0.00').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    totalDays: integer('total_days'),
    actualDays: integer('actual_days'),
    status: text('status').default('active').notNull(),
    notes: text(),
    assignedBy: integer('assigned_by').references(() => employees.id),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'project_manpower_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'project_manpower_employee_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.assignedBy],
      foreignColumns: [employees.id],
      name: 'project_manpower_assigned_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const projectEquipment = pgTable(
  'project_equipment',
  {
    id: serial().primaryKey().notNull(),
    projectId: integer('project_id').notNull(),
    equipmentId: integer('equipment_id').notNull(),
    operatorId: integer('operator_id'), // Now references projectManpower.id instead of employees.id
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).notNull(),
    estimatedHours: numeric('estimated_hours', { precision: 8, scale: 2 }),
    actualHours: numeric('actual_hours', { precision: 8, scale: 2 }),
    maintenanceCost: numeric('maintenance_cost', { precision: 10, scale: 2 }),
    fuelConsumption: numeric('fuel_consumption', { precision: 8, scale: 2 }),
    status: text().default('active').notNull(), // active, maintenance, returned, damaged
    notes: text(),
    assignedBy: integer('assigned_by'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'project_equipment_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
      name: 'project_equipment_equipment_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    foreignKey({
      columns: [table.operatorId],
      foreignColumns: [projectManpower.id],
      name: 'project_equipment_operator_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.assignedBy],
      foreignColumns: [employees.id],
      name: 'project_equipment_assigned_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const projectMaterials = pgTable(
  'project_materials',
  {
    id: serial().primaryKey().notNull(),
    projectId: integer('project_id').notNull(),
    name: text().notNull(),
    description: text(),
    category: text().notNull(), // construction, electrical, plumbing, etc.
    unit: text().notNull(), // kg, m, pieces, etc.
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalCost: numeric('total_cost', { precision: 12, scale: 2 }),
    supplier: text(),
    orderDate: date('order_date'),
    deliveryDate: date('delivery_date'),
    status: text().default('ordered').notNull(), // ordered, delivered, used, returned
    notes: text(),
    assignedTo: integer('assigned_to'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'project_materials_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.assignedTo],
      foreignColumns: [employees.id],
      name: 'project_materials_assigned_to_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const projectFuel = pgTable(
  'project_fuel',
  {
    id: serial().primaryKey().notNull(),
    projectId: integer('project_id').notNull(),
    fuelType: text('fuel_type').notNull(), // diesel, gasoline, etc.
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(), // in liters
    unitPrice: numeric('unit_price', { precision: 8, scale: 2 }).notNull(),
    totalCost: numeric('total_cost', { precision: 10, scale: 2 }),
    supplier: text(),
    purchaseDate: date('purchase_date').notNull(),
    equipmentId: integer('equipment_id'), // if specific to equipment
    operatorId: integer('operator_id'), // who used it
    usageNotes: text('usage_notes'),
    status: text().default('purchased').notNull(), // purchased, used, returned
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'project_fuel_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
      name: 'project_fuel_equipment_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.operatorId],
      foreignColumns: [employees.id],
      name: 'project_fuel_operator_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const projectExpenses = pgTable(
  'project_expenses',
  {
    id: serial().primaryKey().notNull(),
    projectId: integer('project_id').notNull(),
    title: text().notNull(),
    description: text(),
    category: text().notNull(), // travel, accommodation, permits, etc.
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    expenseDate: date('expense_date').notNull(),
    receiptNumber: text('receipt_number'),
    approvedBy: integer('approved_by'),
    status: text().default('pending').notNull(), // pending, approved, rejected, paid
    paymentMethod: text('payment_method'),
    vendor: text(),
    notes: text(),
    assignedTo: integer('assigned_to'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'project_expenses_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [employees.id],
      name: 'project_expenses_approved_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.assignedTo],
      foreignColumns: [employees.id],
      name: 'project_expenses_assigned_to_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);

export const projectSubcontractors = pgTable(
  'project_subcontractors',
  {
    id: serial().primaryKey().notNull(),
    projectId: integer('project_id').notNull(),
    companyName: text('company_name').notNull(),
    contactPerson: text('contact_person'),
    phone: text(),
    email: text(),
    scopeOfWork: text('scope_of_work').notNull(),
    contractValue: numeric('contract_value', { precision: 12, scale: 2 }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    status: text().default('active').notNull(), // active, completed, terminated
    paymentTerms: text('payment_terms'),
    notes: text(),
    assignedBy: integer('assigned_by'),
    createdAt: date('created_at').default(sql`CURRENT_DATE`).notNull(),
    updatedAt: date('updated_at').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'project_subcontractors_project_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.assignedBy],
      foreignColumns: [employees.id],
      name: 'project_subcontractors_assigned_by_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
);
