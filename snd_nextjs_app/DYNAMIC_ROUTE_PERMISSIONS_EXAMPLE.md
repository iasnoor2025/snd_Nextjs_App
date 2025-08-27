# Dynamic Route Permissions Example

## 🎯 **The Problem You Identified**

You're absolutely right! The original `canAccessRoute` function had **hardcoded route permissions**:

```typescript
// OLD SYSTEM - Hardcoded (Problematic!)
const routePermissions = {
  '/dashboard': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
  // ... what about NEW_ROLE? It won't have access to any routes!
};
```

## ✅ **The Solution: Dynamic Route Permissions**

Now the system automatically grants route access to new roles based on their permissions!

## 🚀 **How It Works**

### **1. Automatic Route Access Granting**

When you add a new role, the system automatically analyzes its permissions and grants access to relevant routes:

```typescript
import { addNewRoleWithRouteAccess } from '@/lib/rbac/server-rbac';

// Add a new role - route access is automatically granted!
addNewRoleWithRouteAccess('CUSTOMER_SERVICE', 5, [
  'read.Customer',
  'manage.Customer',
  'read.Quotation',
  'export.Report'
]);

// The system automatically grants access to:
// ✅ /modules/customer-management (because of read.Customer)
// ✅ /modules/quotation-management (because of read.Quotation)
// ✅ /modules/analytics (because of export.Report)
// ✅ /dashboard (basic access for all roles)
```

### **2. Permission-Based Route Mapping**

The system maps permissions to routes automatically:

| Permission | Automatically Grants Access To |
|------------|--------------------------------|
| `read.Employee` | `/modules/employee-management` |
| `read.Customer` | `/modules/customer-management` |
| `read.Equipment` | `/modules/equipment-management` |
| `read.Project` | `/modules/project-management` |
| `read.Timesheet` | `/modules/timesheet-management` |
| `read.Report` | `/modules/analytics`, `/modules/reporting`, `/reports` |
| `read.Settings` | `/modules/settings` |
| `read.Quotation` | `/modules/quotation-management` |
| `read.Leave` | `/modules/leave-management` |
| `read.Payroll` | `/modules/payroll-management` |
| `read.SalaryIncrement` | `/modules/salary-increments` |
| `read.Safety` | `/modules/safety-management` |

## 📝 **Complete Example: Adding a Quality Assurance Role**

### **Step 1: Define the Role**
```typescript
const qualityAssuranceRole = {
  name: 'QUALITY_ASSURANCE',
  priority: 4, // Same as SUPERVISOR
  permissions: [
    'read.Employee',
    'read.Equipment',
    'manage.QualityCheck',
    'read.Report',
    'export.Report',
    'read.Safety',
    'manage.SafetyIncident'
  ]
};
```

### **Step 2: Add the Role with Automatic Route Access**
```typescript
import { addNewRoleWithRouteAccess } from '@/lib/rbac/server-rbac';

addNewRoleWithRouteAccess(
  qualityAssuranceRole.name,
  qualityAssuranceRole.priority,
  qualityAssuranceRole.permissions
);
```

### **Step 3: What Happens Automatically**

The system automatically grants route access based on permissions:

```typescript
// Automatic route access granted:
✅ /modules/employee-management (read.Employee)
✅ /modules/equipment-management (read.Equipment)
✅ /modules/analytics (read.Report)
✅ /modules/reporting (read.Report)
✅ /reports (read.Report)
✅ /modules/safety-management (read.Safety)
✅ /dashboard (basic access)
```

## 🔧 **Available Functions**

### **Server-Side (API Routes)**
```typescript
import { 
  addNewRoleWithRouteAccess,
  addRoutePermission,
  removeRoutePermission,
  autoGrantRouteAccess,
  canAccessRouteEnhanced
} from '@/lib/rbac/server-rbac';

// Add role with automatic route access
addNewRoleWithRouteAccess('NEW_ROLE', 5, ['read.Employee', 'read.Report']);

// Manually add route permission
addRoutePermission('/custom-route', 'read', 'Custom', ['NEW_ROLE']);

// Remove route permission
removeRoutePermission('/custom-route');

// Enhanced route checking (includes dynamic permissions)
const canAccess = await canAccessRouteEnhanced(user, '/custom-route');
```

### **Client-Side (React Components)**
```typescript
import { 
  addNewRoleClient,
  addRoutePermissionClient,
  removeRoutePermissionClient
} from '@/lib/rbac/rbac-context';

// Add new role (route access handled automatically)
addNewRoleClient('NEW_ROLE', 5, ['read.Employee', 'read.Report']);

// Manually add route permission
addRoutePermissionClient('/custom-route', 'read', 'Custom', ['NEW_ROLE']);

// Remove route permission
removeRoutePermissionClient('/custom-route');
```

## 📊 **Real-World Examples**

### **Example 1: Finance Specialist**
```typescript
addNewRoleWithRouteAccess('FINANCE_SPECIALIST', 5, [
  'read.Payroll',
  'manage.Payroll',
  'read.SalaryIncrement',
  'read.Report',
  'export.Report',
  'read.Employee'
]);

// Automatically gets access to:
// ✅ /modules/payroll-management
// ✅ /modules/salary-increments
// ✅ /modules/analytics
// ✅ /modules/reporting
// ✅ /reports
// ✅ /modules/employee-management
// ✅ /dashboard
```

### **Example 2: Project Manager**
```typescript
addNewRoleWithRouteAccess('PROJECT_MANAGER', 4, [
  'manage.Project',
  'read.Employee',
  'manage.Timesheet',
  'read.Report',
  'export.Report',
  'read.Customer',
  'read.Equipment'
]);

// Automatically gets access to:
// ✅ /modules/project-management
// ✅ /modules/employee-management
// ✅ /modules/timesheet-management
// ✅ /modules/analytics
// ✅ /modules/reporting
// ✅ /reports
// ✅ /modules/customer-management
// ✅ /modules/equipment-management
// ✅ /dashboard
```

### **Example 3: HR Specialist**
```typescript
addNewRoleWithRouteAccess('HR_SPECIALIST', 5, [
  'read.Employee',
  'manage.Employee',
  'manage.Leave',
  'read.Report',
  'read.User',
  'read.Department'
]);

// Automatically gets access to:
// ✅ /modules/employee-management
// ✅ /modules/leave-management
// ✅ /modules/analytics
// ✅ /modules/reporting
// ✅ /reports
// ✅ /modules/user-management
// ✅ /dashboard
```

## 🔄 **How Route Access is Determined**

### **Priority Order:**
1. **Dynamic Route Permissions** (newer, takes precedence)
2. **Base Route Permissions** (fallback)

### **Example Flow:**
```typescript
// 1. Check if route has dynamic permission
const dynamicPermission = dynamicRoutePermissions.get('/custom-route');
if (dynamicPermission) {
  return dynamicPermission.roles.includes(user.role);
}

// 2. Fall back to base route permissions
const basePermission = baseRoutePermissions['/custom-route'];
if (basePermission) {
  return basePermission.roles.includes(user.role);
}

// 3. Allow access if no permission defined
return true;
```

## 🎉 **Benefits**

✅ **No More Hardcoded Routes** - New roles automatically get appropriate access
✅ **Permission-Driven Access** - Routes are granted based on what the role can do
✅ **Automatic Updates** - When you change role permissions, route access updates automatically
✅ **Consistent Behavior** - Same logic on both client and server
✅ **Easy Management** - Add/remove routes without code changes
✅ **Scalable** - Works with unlimited new roles

## 🚨 **Important Notes**

1. **Route access is granted automatically** when you add a new role
2. **You can override** automatic access with manual route permissions
3. **Dynamic permissions take precedence** over base permissions
4. **Route access updates automatically** when you change role permissions
5. **Works on both client and server** for consistency

## 🔍 **Testing Your New Role**

After adding a new role, you can test route access:

```typescript
// Check if role can access a specific route
const canAccess = await canAccessRouteEnhanced(user, '/modules/employee-management');
console.log(`Can access employee management: ${canAccess}`);

// List all dynamic route permissions
const dynamicRoutes = getDynamicRoutePermissions();
console.log('Dynamic route permissions:', dynamicRoutes);
```

**Now when you create a new role, it automatically gets access to all relevant routes based on its permissions - no more hardcoded route lists!**
