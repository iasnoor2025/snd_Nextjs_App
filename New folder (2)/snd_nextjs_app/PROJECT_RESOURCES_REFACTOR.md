# Project Resources Refactoring

## Overview
The project resources system has been refactored from a single generic `project_resources` table to separate, focused tables for different resource types. This provides better data organization, type safety, and easier querying.

## New Table Structure

### 1. Project Manpower (`project_manpower`)
**Purpose**: Track human resources assigned to projects
- **Key Fields**:
  - `project_id` → `projects.id`
  - `employee_id` → `employees.id`
  - `job_title` - Specific role on the project
  - `daily_rate` - Cost per day
  - `start_date` / `end_date` - Assignment period
  - `total_days` / `actual_days` - Planned vs actual
  - `status` - active, completed, terminated

### 2. Project Equipment (`project_equipment`)
**Purpose**: Track equipment and machinery assigned to projects
- **Key Fields**:
  - `project_id` → `projects.id`
  - `equipment_id` → `equipment.id`
  - `operator_id` → `employees.id` (who operates it)
  - `hourly_rate` - Cost per hour
  - `estimated_hours` / `actual_hours` - Planned vs actual usage
  - `maintenance_cost` - Additional maintenance expenses
  - `fuel_consumption` - Fuel usage tracking
  - `status` - active, maintenance, returned, damaged

### 3. Project Materials (`project_materials`)
**Purpose**: Track construction and project materials
- **Key Fields**:
  - `project_id` → `projects.id`
  - `name` / `description` - Material details
  - `category` - construction, electrical, plumbing, etc.
  - `unit` - kg, m, pieces, etc.
  - `quantity` / `unit_price` / `total_cost` - Cost tracking
  - `supplier` - Vendor information
  - `order_date` / `delivery_date` - Supply chain tracking
  - `status` - ordered, delivered, used, returned

### 4. Project Fuel (`project_fuel`)
**Purpose**: Track fuel consumption for equipment and vehicles
- **Key Fields**:
  - `project_id` → `projects.id`
  - `fuel_type` - diesel, gasoline, etc.
  - `quantity` - Liters consumed
  - `unit_price` / `total_cost` - Cost tracking
  - `supplier` - Fuel vendor
  - `equipment_id` → `equipment.id` (if specific to equipment)
  - `operator_id` → `employees.id` (who used it)
  - `status` - purchased, used, returned

### 5. Project Expenses (`project_expenses`)
**Purpose**: Track miscellaneous project expenses
- **Key Fields**:
  - `project_id` → `projects.id`
  - `title` / `description` - Expense details
  - `category` - travel, accommodation, permits, etc.
  - `amount` - Total cost
  - `expense_date` - When incurred
  - `receipt_number` - Documentation
  - `approved_by` → `employees.id` - Approval workflow
  - `status` - pending, approved, rejected, paid
  - `payment_method` / `vendor` - Payment details

### 6. Project Subcontractors (`project_subcontractors`)
**Purpose**: Track external contractors and subcontractors
- **Key Fields**:
  - `project_id` → `projects.id`
  - `company_name` / `contact_person` - Contractor details
  - `phone` / `email` - Contact information
  - `scope_of_work` - What they're responsible for
  - `contract_value` - Total contract amount
  - `start_date` / `end_date` - Contract period
  - `status` - active, completed, terminated
  - `payment_terms` - Payment schedule

## Benefits of the New Structure

### 1. **Type Safety**
- Each resource type has its own specific fields
- No more generic fields that don't apply to all types
- Better validation and constraints

### 2. **Easier Querying**
- Direct queries without complex type filtering
- Better performance with focused indexes
- Clearer business logic

### 3. **Data Integrity**
- Foreign key constraints ensure data consistency
- Cascade deletes maintain referential integrity
- Proper validation for each resource type

### 4. **Scalability**
- Easy to add new resource types
- Better performance with smaller, focused tables
- Easier to implement caching strategies

## Migration from Old System

The old `project_resources` table remains for backward compatibility, but new implementations should use the specific resource tables:

### Old Way (Generic)
```typescript
// Single table for all resource types
const resources = await db
  .select()
  .from(projectResources)
  .where(eq(projectResources.projectId, projectId));
```

### New Way (Specific)
```typescript
// Separate queries for each resource type
const manpower = await db
  .select()
  .from(projectManpower)
  .where(eq(projectManpower.projectId, projectId));

const equipment = await db
  .select()
  .from(projectEquipment)
  .where(eq(projectEquipment.projectId, projectId));

const materials = await db
  .select()
  .from(projectMaterials)
  .where(eq(projectMaterials.projectId, projectId));
```

## API Endpoints

Each resource type should have its own API endpoints:

- `/api/projects/[id]/manpower` - CRUD for manpower
- `/api/projects/[id]/equipment` - CRUD for equipment  
- `/api/projects/[id]/materials` - CRUD for materials
- `/api/projects/[id]/fuel` - CRUD for fuel
- `/api/projects/[id]/expenses` - CRUD for expenses
- `/api/projects/[id]/subcontractors` - CRUD for subcontractors

## Next Steps

1. **Update API Routes**: Create new API endpoints for each resource type
2. **Update Frontend Components**: Modify UI to use specific resource tables
3. **Data Migration**: Move existing data from `project_resources` to appropriate new tables
4. **Deprecate Old Table**: Eventually remove the generic `project_resources` table

## Database Schema

All new tables include:
- `id` - Primary key
- `project_id` - Foreign key to projects
- `created_at` / `updated_at` - Timestamps
- Appropriate foreign keys for related entities
- Status fields for workflow management
- Notes fields for additional information
