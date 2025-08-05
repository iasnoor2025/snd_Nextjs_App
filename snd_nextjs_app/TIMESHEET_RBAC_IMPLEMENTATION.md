# Timesheet Approval RBAC Implementation

## Overview

This document describes the implementation of a database-driven Role-Based Access Control (RBAC) system for timesheet approvals, replacing the previous hardcoded role-based system.

## Key Changes

### 1. Database-Driven Permissions

The new system stores all permissions in the database with the following structure:

```sql
-- Permissions table
permissions: id, name, guard_name

-- Role-Permission assignments
role_permissions: role_id, permission_id

-- User-Permission assignments (for direct user permissions)
user_permissions: user_id, permission_id
```

### 2. Timesheet-Specific Permissions

The following permissions have been added for timesheet operations:

#### Basic CRUD Permissions
- `read.timesheet` - View timesheets
- `create.timesheet` - Create new timesheets
- `update.timesheet` - Update existing timesheets
- `delete.timesheet` - Delete timesheets
- `manage.timesheet` - Full timesheet management

#### Approval Stage Permissions
- `approve.timesheet.foreman` - Approve at foreman stage
- `approve.timesheet.incharge` - Approve at incharge stage
- `approve.timesheet.checking` - Approve at checking stage
- `approve.timesheet.manager` - Approve at manager stage

#### Rejection Stage Permissions
- `reject.timesheet.foreman` - Reject at foreman stage
- `reject.timesheet.incharge` - Reject at incharge stage
- `reject.timesheet.checking` - Reject at checking stage
- `reject.timesheet.manager` - Reject at manager stage

#### Bulk Operations
- `bulk.approve.timesheet` - Bulk approve timesheets
- `bulk.reject.timesheet` - Bulk reject timesheets
- `submit.timesheet` - Submit timesheets for approval

### 3. Role Assignments

The following roles have been assigned specific timesheet permissions:

#### SUPER_ADMIN
- All permissions (`manage.all`, `*`)

#### ADMIN
- All timesheet management permissions
- All approval and rejection permissions
- Bulk operation permissions

#### MANAGER
- All timesheet management permissions
- All approval and rejection permissions
- Bulk operation permissions

#### FOREMAN
- Read timesheet permissions
- Foreman-specific approval and rejection permissions

#### INCHARGE
- Read timesheet permissions
- Incharge-specific approval and rejection permissions

#### CHECKING
- Read timesheet permissions
- Checking-specific approval and rejection permissions

## Implementation Details

### 1. API Route Updates

#### `/api/timesheets/approve`
- **Old**: Hardcoded role checks (`FOREMAN`, `ADMIN`, `SUPER_ADMIN`)
- **New**: Database-driven permission checks using `withPermission` middleware
- **Permissions**: `approve.timesheet.{stage}` where stage is foreman, incharge, checking, or manager

#### `/api/timesheets/reject`
- **Old**: Hardcoded role checks
- **New**: Database-driven permission checks
- **Permissions**: `reject.timesheet.{stage}`

#### `/api/timesheets/bulk-approve`
- **Old**: Complex hardcoded role-based logic
- **New**: Database-driven permission checks with helper functions
- **Permissions**: `bulk.approve.timesheet` or `bulk.reject.timesheet`

#### `/api/timesheets/route.ts`
- **Old**: No permission checks
- **New**: Permission checks for all CRUD operations
- **Permissions**: `read.timesheet`, `create.timesheet`, `update.timesheet`, `delete.timesheet`

### 2. Permission Checking Logic

The new system uses the `checkUserPermission` function from `permission-service.ts`:

```typescript
// Check if user has permission for specific action and subject
const result = await checkUserPermission(userId, 'approve', 'timesheet');

// Check stage-specific permissions
const stageResult = await checkUserPermission(userId, 'approve', `timesheet.${stage}`);
```

### 3. Middleware Integration

All timesheet API routes now use the `withPermission` middleware:

```typescript
export const POST = withPermission(
  async (request: NextRequest) => {
    // API logic here
  },
  {
    action: 'approve',
    subject: 'timesheet',
    checkPermission: async (request: NextRequest) => {
      // Custom permission logic for specific stages
    }
  }
);
```

## Approval Workflow

### Stage Progression
1. **Draft** → **Submitted** (requires `submit.timesheet` permission)
2. **Submitted** → **Foreman Approved** (requires `approve.timesheet.foreman`)
3. **Foreman Approved** → **Incharge Approved** (requires `approve.timesheet.incharge`)
4. **Incharge Approved** → **Checking Approved** (requires `approve.timesheet.checking`)
5. **Checking Approved** → **Manager Approved** (requires `approve.timesheet.manager`)

### Permission Hierarchy
- Direct user permissions override role permissions
- General permissions (e.g., `approve.timesheet`) grant access to all stages
- Stage-specific permissions (e.g., `approve.timesheet.foreman`) grant access to specific stages
- Bulk permissions allow processing multiple timesheets at once

## Database Schema

### Permissions Table
```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  guard_name VARCHAR(255) DEFAULT 'web',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Role Permissions Table
```sql
CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

### User Permissions Table
```sql
CREATE TABLE user_permissions (
  user_id INTEGER REFERENCES users(id),
  permission_id INTEGER REFERENCES permissions(id),
  PRIMARY KEY (user_id, permission_id)
);
```

## Migration from Old System

### 1. Permission Seeding
Run the updated permission seeding script:
```bash
node scripts/seed-permissions.js
```

This will:
- Create all timesheet-specific permissions
- Assign permissions to existing roles
- Set up the permission hierarchy

### 2. API Route Updates
All timesheet API routes have been updated to use the new RBAC system:
- `/api/timesheets/approve` - Updated with permission checks
- `/api/timesheets/reject` - Updated with permission checks
- `/api/timesheets/bulk-approve` - Updated with permission checks
- `/api/timesheets/route.ts` - Updated with CRUD permission checks

### 3. Frontend Integration
The frontend components should be updated to use the new permission-based checks instead of role-based checks.

## Benefits

### 1. Flexibility
- Permissions can be assigned/revoked without code changes
- New roles can be created with custom permission sets
- Individual users can have specific permissions

### 2. Security
- All permission checks are centralized in the database
- No hardcoded role checks in API routes
- Audit trail of permission assignments

### 3. Maintainability
- Permission logic is centralized in the `permission-service.ts`
- Easy to add new permissions or modify existing ones
- Clear separation between authorization and business logic

### 4. Scalability
- Supports complex permission hierarchies
- Can handle multiple roles per user
- Supports direct user permissions

## Testing

### 1. Permission Testing
Test that users can only perform actions they have permissions for:
- Users with `approve.timesheet.foreman` can only approve at foreman stage
- Users with `bulk.approve.timesheet` can perform bulk approvals
- Users without permissions get 403 errors

### 2. Role Testing
Test that role assignments work correctly:
- FOREMAN role can only approve at foreman stage
- ADMIN role can approve at all stages
- MANAGER role can approve at all stages

### 3. Edge Cases
Test edge cases:
- Users with no permissions
- Users with conflicting permissions
- Invalid permission names
- Database connection issues

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user has the required permission
   - Verify role assignments in database
   - Check permission service logs

2. **Database Connection Issues**
   - Verify database connection
   - Check Prisma client configuration
   - Review database migration status

3. **Role Assignment Issues**
   - Verify roles exist in database
   - Check role-permission assignments
   - Review permission seeding script

### Debugging

Enable debug logging in the permission service:
```typescript
console.log('Permission check:', { userId, action, subject, result });
```

Check database directly:
```sql
-- Check user permissions
SELECT p.name FROM permissions p
JOIN user_permissions up ON p.id = up.permission_id
WHERE up.user_id = ?;

-- Check role permissions
SELECT p.name FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN user_roles ur ON rp.role_id = ur.role_id
WHERE ur.user_id = ?;
```

## Future Enhancements

### 1. Permission Groups
Create permission groups for easier management:
- `timesheet.approval` - All approval permissions
- `timesheet.rejection` - All rejection permissions
- `timesheet.management` - All management permissions

### 2. Dynamic Permissions
Support dynamic permission creation based on business rules:
- Project-specific permissions
- Time-based permissions
- Conditional permissions

### 3. Permission Auditing
Add comprehensive auditing for permission changes:
- Who granted/revoked permissions
- When permissions were changed
- Reason for permission changes

### 4. Permission Caching
Implement permission caching for better performance:
- Cache user permissions in session
- Cache role permissions
- Invalidate cache on permission changes

## Conclusion

The new database-driven RBAC system for timesheet approvals provides:
- **Flexibility**: Easy to modify permissions without code changes
- **Security**: Centralized permission management
- **Maintainability**: Clear separation of concerns
- **Scalability**: Support for complex permission hierarchies

The system successfully replaces the hardcoded role-based checks with a robust, database-driven permission system that can grow with the application's needs. 