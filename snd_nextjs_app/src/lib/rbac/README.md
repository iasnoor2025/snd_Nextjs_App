# RBAC (Role-Based Access Control) System

This document describes the comprehensive RBAC system implemented using CASL (Conditional Access Control Lists) for the SND Rental Management System.

## 🏗️ Architecture

### Core Components

1. **CASL Abilities** (`abilities.ts`)
   - Defines permissions and roles
   - Creates ability instances for users
   - Handles permission checking

2. **RBAC Context** (`rbac-context.tsx`)
   - React context for RBAC state
   - Provides hooks for permission checking
   - Integrates with NextAuth session

3. **RBAC Components** (`rbac-components.tsx`)
   - Reusable components for conditional rendering
   - Access control components
   - Role-based content rendering

4. **Middleware** (`middleware.ts`)
   - Route-level protection
   - JWT token validation
   - Role-based route access

## 👥 Role Hierarchy

```
SUPER_ADMIN (6) - Full system access
    ↓
ADMIN (5) - System administration
    ↓
MANAGER (4) - Department management
    ↓
SUPERVISOR (3) - Team supervision
    ↓
OPERATOR (2) - Basic operations
    ↓
USER (1) - Read-only access
```

## 🔐 Permission System

### Actions

- `create` - Create new resources
- `read` - View resources
- `update` - Modify resources
- `delete` - Remove resources
- `manage` - Full CRUD access
- `approve` - Approve workflows
- `reject` - Reject workflows
- `export` - Export data
- `import` - Import data
- `sync` - Sync with external systems
- `reset` - Reset system data

### Subjects

- `User` - User management
- `Employee` - Employee records
- `Customer` - Customer data
- `Equipment` - Equipment inventory
- `Rental` - Rental transactions
- `Payroll` - Payroll management
- `Timesheet` - Time tracking
- `Project` - Project management
- `Department` - Department structure
- `Designation` - Job positions
- `Report` - System reports
- `Settings` - System configuration

## 🎯 Usage Examples

### 1. Component-Level Protection

```tsx
import { Can, RoleBased } from '@/lib/rbac/rbac-components';

// Permission-based rendering
<Can action="create" subject="Employee">
  <Button>Add Employee</Button>
</Can>

// Role-based rendering
<RoleBased roles={['ADMIN', 'MANAGER']}>
  <AdminPanel />
</RoleBased>
```

### 2. Route-Level Protection

```tsx
import { ProtectedRoute } from '@/components/protected-route';

// Permission-based route protection
<ProtectedRoute requiredPermission={{ action: 'read', subject: 'Employee' }}>
  <EmployeeManagementPage />
</ProtectedRoute>

// Role-based route protection
<ProtectedRoute requiredRole="ADMIN">
  <AdminPage />
</ProtectedRoute>
```

### 3. Hook Usage

```tsx
import { useRBAC, usePermission } from '@/lib/rbac/rbac-context';

function MyComponent() {
  const { user, hasPermission } = useRBAC();
  const canCreateEmployee = usePermission('create', 'Employee');

  if (canCreateEmployee) {
    // Show create button
  }
}
```

### 4. API Route Protection

```tsx
// In API routes
import { hasPermission } from '@/lib/rbac/abilities';

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!hasPermission(user, 'create', 'Employee')) {
    return new Response('Unauthorized', { status: 403 });
  }

  // Handle request
}
```

## 🛡️ Security Features

### 1. Multi-Level Protection

- **Route Level**: Middleware checks before page load
- **Component Level**: Conditional rendering based on permissions
- **API Level**: Server-side permission validation
- **Data Level**: Field-level access control

### 2. Role Hierarchy

- Higher roles inherit permissions from lower roles
- Automatic permission escalation
- Granular permission control

### 3. Session Integration

- Seamless integration with NextAuth
- Automatic permission updates on role changes
- Secure JWT-based authentication

## 📋 Role Permissions Matrix

| Role        | Employee      | Customer           | Equipment   | Rental             | Payroll      | Timesheet            | Project            | Settings |
| ----------- | ------------- | ------------------ | ----------- | ------------------ | ------------ | -------------------- | ------------------ | -------- |
| SUPER_ADMIN | Full          | Full               | Full        | Full               | Full         | Full                 | Full               | Full     |
| ADMIN       | Full          | Full               | Full        | Full               | Full         | Full                 | Full               | Full     |
| MANAGER     | Read/Update   | Full               | Read/Update | Read/Create/Update | Read/Approve | Read/Approve         | Full               | Read     |
| SUPERVISOR  | Read          | Read/Create/Update | Read        | Read/Create/Update | Read         | Read/Approve         | Read/Create/Update | None     |
| OPERATOR    | Read/Update\* | Read               | Read        | Read/Create/Update | Read         | Read/Create/Update\* | Read               | None     |
| USER        | Read          | Read               | Read        | Read               | None         | Read                 | Read               | None     |

\*Limited to own data

## 🔧 Configuration

### Environment Variables

```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Adding New Roles

1. Update `rolePermissions` in `abilities.ts`
2. Add role to `roleHierarchy` in middleware
3. Update route permissions in middleware
4. Test with different user roles

### Adding New Permissions

1. Add action to `Actions` type
2. Add subject to `Subjects` type
3. Update role permissions matrix
4. Test permission checks

## 🧪 Testing

### Test Different Roles

```bash
# Create test users with different roles
npm run db:reset  # Creates admin user
# Manually create users with different roles in database
```

### Test Permission Components

```tsx
// Test permission-based rendering
<Can action="create" subject="Employee" fallback={<p>No permission</p>}>
  <Button>Add Employee</Button>
</Can>
```

## 🚀 Best Practices

1. **Always use RBAC components** for conditional rendering
2. **Check permissions server-side** in API routes
3. **Use role hierarchy** for permission inheritance
4. **Test with different user roles** regularly
5. **Document permission requirements** for new features
6. **Use fallback components** for better UX
7. **Implement proper error handling** for access denied scenarios

## 🔍 Debugging

### Check User Permissions

```tsx
import { useRBAC } from '@/lib/rbac/rbac-context';

function DebugComponent() {
  const { user, hasPermission, getAllowedActions } = useRBAC();

  console.log('User:', user);
  console.log('Can create employee:', hasPermission('create', 'Employee'));
  console.log('Allowed actions for Employee:', getAllowedActions('Employee'));
}
```

### Check Route Access

```tsx
import { useRouteAccess } from '@/lib/rbac/rbac-context';

function DebugRoute() {
  const canAccess = useRouteAccess('/modules/employee-management');
  console.log('Can access employee management:', canAccess);
}
```

## 📚 Additional Resources

- [CASL Documentation](https://casl.js.org/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [React Context Documentation](https://reactjs.org/docs/context.html)
