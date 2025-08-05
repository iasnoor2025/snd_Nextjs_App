# Database-Driven RBAC Permission System

## Overview

This document describes the comprehensive database-driven Role-Based Access Control (RBAC) system that replaces hardcoded permissions with a flexible, database-backed permission management system.

## 🏗️ Architecture

### Core Components

1. **Database Schema** - Permissions stored in PostgreSQL
2. **Permission Service** - Backend permission checking logic
3. **API Middleware** - Route-level permission protection
4. **Management APIs** - CRUD operations for permissions
5. **Seed Scripts** - Initial permission setup

### Database Tables

- `permissions` - Individual permissions
- `roles` - User roles
- `role_permissions` - Role-permission assignments
- `user_permissions` - Direct user-permission assignments
- `user_roles` - User-role assignments

## 🔐 Permission Structure

### Permission Format
Permissions follow the format: `{action}.{subject}`

**Actions:**
- `read` - View resources
- `create` - Create new resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `manage` - Full CRUD access
- `approve` - Approve workflows
- `reject` - Reject workflows
- `export` - Export data
- `import` - Import data
- `sync` - Sync with external systems
- `reset` - Reset system data

**Subjects:**
- `User` - User management
- `Employee` - Employee records
- `Customer` - Customer data
- `Equipment` - Equipment inventory
- `Rental` - Rental transactions
- `Payroll` - Payroll management
- `Timesheet` - Time tracking
- `Project` - Project management
- `Leave` - Leave management
- `Department` - Department structure
- `Designation` - Job positions
- `Report` - System reports
- `Settings` - System configuration
- `Company` - Company management
- `Location` - Location management

### Examples
- `read.employee` - Can view employee records
- `create.customer` - Can create new customers
- `manage.timesheet` - Full timesheet management
- `approve.leave` - Can approve leave requests

## 🚀 Usage

### 1. API Route Protection

Use the `withPermission` middleware to protect API routes:

```typescript
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// GET endpoint with read permission
export const GET = withPermission(
  async (request: NextRequest) => {
    // Your API logic here
    return NextResponse.json({ data: 'success' });
  },
  PermissionConfigs.employee.read
);

// POST endpoint with create permission
export const POST = withPermission(
  async (request: NextRequest) => {
    // Your API logic here
    return NextResponse.json({ data: 'created' });
  },
  PermissionConfigs.employee.create
);
```

### 2. Custom Permission Checks

For more complex scenarios, use the permission service directly:

```typescript
import { checkUserPermission } from '@/lib/rbac/permission-service';

// In your API route
const permissionCheck = await checkUserPermission(
  userId,
  'approve',
  'timesheet'
);

if (!permissionCheck.hasPermission) {
  return NextResponse.json(
    { error: permissionCheck.reason },
    { status: 403 }
  );
}
```

### 3. Frontend Permission Checking

Use the existing RBAC hooks for frontend components:

```typescript
import { usePermission } from '@/lib/rbac/rbac-context';

function MyComponent() {
  const { can } = usePermission();
  
  return (
    <div>
      {can('create', 'employee') && (
        <button>Add Employee</button>
      )}
      
      {can('approve', 'timesheet') && (
        <button>Approve Timesheet</button>
      )}
    </div>
  );
}
```

## 📊 Permission Management

### 1. Create Permissions

```typescript
// Via API
POST /api/permissions
{
  "name": "custom.permission",
  "guard_name": "web"
}

// Via service
import { createPermission } from '@/lib/rbac/permission-service';

const result = await createPermission('custom.permission', 'web');
```

### 2. Assign Permissions to Roles

```typescript
// Via API
POST /api/roles/{roleId}/permissions
{
  "permissionIds": [1, 2, 3, 4]
}

// Via service
import { assignPermissionsToRole } from '@/lib/rbac/permission-service';

const result = await assignPermissionsToRole(roleId, [1, 2, 3, 4]);
```

### 3. Assign Direct User Permissions

```typescript
// Via service
import { assignPermissionsToUser } from '@/lib/rbac/permission-service';

const result = await assignPermissionsToUser(userId, [1, 2, 3, 4]);
```

## 🔧 Setup Instructions

### 1. Seed Permissions

Run the permission seed script to populate initial permissions:

```bash
cd snd_nextjs_app
node scripts/seed-permissions.js
```

### 2. Update Existing API Routes

Replace hardcoded permission checks with the new middleware:

**Before:**
```typescript
// Hardcoded check
if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

**After:**
```typescript
// Database-driven check
export const GET = withPermission(
  async (request: NextRequest) => {
    // Your logic here
  },
  PermissionConfigs.employee.read
);
```

### 3. Update Frontend Components

Replace hardcoded role checks with permission checks:

**Before:**
```typescript
{user.role === 'ADMIN' && <AdminPanel />}
```

**After:**
```typescript
{can('manage', 'settings') && <AdminPanel />}
```

## 📋 Permission Matrix

### Role-Based Permissions

| Role | Employee | Customer | Equipment | Rental | Payroll | Timesheet | Project | Settings |
|------|----------|----------|-----------|--------|---------|-----------|---------|----------|
| SUPER_ADMIN | manage | manage | manage | manage | manage | manage | manage | manage |
| ADMIN | manage | manage | manage | manage | manage | manage | manage | manage |
| MANAGER | manage | manage | manage | manage | read | manage | manage | read |
| SUPERVISOR | manage | read | read | read | read | manage | manage | read |
| OPERATOR | read | manage | manage | manage | read | manage | manage | read |
| EMPLOYEE | read | read | read | read | read | manage | read | read |
| USER | read | read | read | read | - | read | read | read |

## 🔍 Debugging

### Check User Permissions

```typescript
import { getUserPermissions } from '@/lib/rbac/permission-service';

const userPerms = await getUserPermissions(userId);
console.log('User permissions:', userPerms);
```

### Check Specific Permission

```typescript
import { checkUserPermission } from '@/lib/rbac/permission-service';

const check = await checkUserPermission(userId, 'create', 'employee');
console.log('Permission check:', check);
```

## 🛡️ Security Features

### 1. Database-Driven Validation
- All permissions stored in database
- No hardcoded permission checks
- Flexible permission management

### 2. Role Hierarchy
- SUPER_ADMIN > ADMIN > MANAGER > SUPERVISOR > OPERATOR > EMPLOYEE > USER
- Higher roles inherit permissions from lower roles

### 3. Direct User Permissions
- Users can have direct permissions that override role permissions
- Useful for temporary access or exceptions

### 4. Transaction Safety
- All permission assignments use database transactions
- Ensures data consistency

### 5. Audit Trail
- All permission changes are logged
- Easy to track who has what permissions

## 📈 Performance Considerations

### 1. Caching
- Permission checks are cached at the session level
- Reduces database queries

### 2. Efficient Queries
- Uses optimized database queries
- Minimal impact on API response times

### 3. Lazy Loading
- Permissions loaded only when needed
- Reduces initial page load time

## 🔄 Migration Guide

### Step 1: Update API Routes
Replace hardcoded checks with middleware:

```typescript
// Old way
if (user.role !== 'ADMIN') return unauthorized();

// New way
export const GET = withPermission(handler, PermissionConfigs.employee.read);
```

### Step 2: Update Frontend Components
Replace role checks with permission checks:

```typescript
// Old way
{user.role === 'ADMIN' && <AdminButton />}

// New way
{can('manage', 'settings') && <AdminButton />}
```

### Step 3: Test Permissions
Use the debugging tools to verify permissions work correctly.

## 🎯 Best Practices

### 1. Use Specific Permissions
- Prefer specific permissions over wildcards
- Makes security easier to audit

### 2. Regular Permission Audits
- Review permissions regularly
- Remove unused permissions

### 3. Document Custom Permissions
- Document any custom permissions created
- Include business justification

### 4. Test Permission Changes
- Always test permission changes in development
- Verify both positive and negative cases

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user has the required role
   - Verify permission is assigned to role
   - Check for direct user permissions

2. **Performance Issues**
   - Check database query performance
   - Verify caching is working
   - Monitor database connection pool

3. **Permission Not Working**
   - Verify permission exists in database
   - Check role-permission assignment
   - Test with different user roles

### Debug Commands

```bash
# Check database permissions
node scripts/check-permissions.js

# Reset permissions to defaults
node scripts/seed-permissions.js

# Check user permissions
curl -H "Authorization: Bearer TOKEN" /api/permissions/user/{userId}
```

## 📚 API Reference

### Permission Management APIs

- `GET /api/permissions` - List all permissions
- `POST /api/permissions` - Create new permission
- `GET /api/permissions/{id}` - Get specific permission
- `PUT /api/permissions/{id}` - Update permission
- `DELETE /api/permissions/{id}` - Delete permission

### Role Permission APIs

- `GET /api/roles/{id}/permissions` - Get role permissions
- `POST /api/roles/{id}/permissions` - Assign permissions to role
- `DELETE /api/roles/{id}/permissions` - Remove all role permissions

### Service Functions

- `checkUserPermission(userId, action, subject)` - Check specific permission
- `getUserPermissions(userId)` - Get all user permissions
- `assignPermissionsToRole(roleId, permissionIds)` - Assign permissions to role
- `assignPermissionsToUser(userId, permissionIds)` - Assign direct user permissions
- `createPermission(name, guardName)` - Create new permission

This system provides a robust, flexible, and secure way to manage permissions without hardcoding them in the application code. 