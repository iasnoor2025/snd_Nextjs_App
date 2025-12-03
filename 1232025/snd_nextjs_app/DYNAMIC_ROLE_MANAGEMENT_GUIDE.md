# Dynamic Role Management Guide

## 🎯 **Overview**

The permission system now supports **dynamic role creation** without requiring code changes or deployments. You can add, remove, and modify roles at runtime.

## 🚀 **How to Add New Roles**

### **Method 1: Runtime Addition (Recommended)**

```typescript
import { addNewRoleClient } from '@/lib/rbac/rbac-context';

// Add a new role with priority and permissions
addNewRoleClient('CUSTOMER_SERVICE', 5, [
  'read.Customer',
  'manage.Customer',
  'read.Quotation',
  'manage.Quotation',
  'read.Report',
  'export.Report'
]);

// The role is now immediately available throughout the system!
```

### **Method 2: Configuration Update**

Update the configuration objects in the code and restart the application:

```typescript
// In src/lib/rbac/rbac-context.tsx or server-rbac.ts
const DYNAMIC_ROLE_HIERARCHY: Record<string, number> = {
  'SUPER_ADMIN': 1,
  'ADMIN': 2,
  'MANAGER': 3,
  'SUPERVISOR': 4,
  'OPERATOR': 5,
  'EMPLOYEE': 6,
  'USER': 7,
  // Add your new role here
  'CUSTOMER_SERVICE': 5, // Same priority as OPERATOR
  'TECHNICAL_SUPPORT': 4, // Same priority as SUPERVISOR
};

const DYNAMIC_FALLBACK_PERMISSIONS: Record<string, string[]> = {
  // ... existing roles ...
  
  // Add permissions for your new role
  CUSTOMER_SERVICE: [
    'read.Customer',
    'manage.Customer',
    'read.Quotation',
    'manage.Quotation',
    'read.Report',
    'export.Report',
    'read.Employee',
    'read.Timesheet'
  ],
  
  TECHNICAL_SUPPORT: [
    'read.Equipment',
    'manage.Equipment',
    'read.Maintenance',
    'manage.Maintenance',
    'read.Report',
    'read.Employee',
    'read.Timesheet'
  ],
};
```

## 📋 **Role Priority System**

### **Priority Levels**
- **Lower number = Higher priority**
- **1 = SUPER_ADMIN** (highest)
- **7 = USER** (lowest)

### **Priority Guidelines**
```typescript
1  - SUPER_ADMIN     // System-wide access
2  - ADMIN           // Administrative access
3  - MANAGER         // Department management
4  - SUPERVISOR      // Team supervision
5  - OPERATOR        // Operational access
6  - EMPLOYEE        // Basic employee access
7  - USER            // Limited access
```

### **Example: Adding a Mid-Level Role**
```typescript
// Add a role between SUPERVISOR and OPERATOR
addNewRoleClient('TEAM_LEAD', 4.5, [
  'manage.Employee',
  'read.Report',
  'manage.Timesheet'
]);
```

## 🔐 **Permission Structure**

### **Permission Format**
```
{action}.{subject}
```

### **Available Actions**
- `create` - Create new records
- `read` - View records
- `update` - Modify existing records
- `delete` - Remove records
- `manage` - Full control (create, read, update, delete)
- `approve` - Approve requests
- `reject` - Reject requests
- `export` - Export data
- `import` - Import data
- `sync` - Synchronize data
- `reset` - Reset/reset operations

### **Available Subjects**
- `User` - User management
- `Employee` - Employee data
- `Customer` - Customer information
- `Equipment` - Equipment management
- `Project` - Project management
- `Timesheet` - Time tracking
- `Report` - Reports and analytics
- `Settings` - System settings
- `Company` - Company information
- `Safety` - Safety management
- `Payroll` - Payroll data
- `Leave` - Leave management

## 📝 **Complete Example: Adding a New Role**

### **Step 1: Define the Role**
```typescript
const newRole = {
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

### **Step 2: Add the Role**
```typescript
import { addNewRoleClient } from '@/lib/rbac/rbac-context';

addNewRoleClient(
  newRole.name,
  newRole.priority,
  newRole.permissions
);
```

### **Step 3: Update Route Access (Optional)**
```typescript
// The role will automatically work with existing route permissions
// But you can add specific route access if needed
const routePermissions = {
  '/modules/quality-management': { 
    action: 'read', 
    subject: 'QualityCheck', 
    roles: ['SUPER_ADMIN', 'ADMIN', 'QUALITY_ASSURANCE'] 
  }
};
```

## 🛠️ **Role Management Functions**

### **Available Functions**

```typescript
// Add new role
addNewRoleClient(roleName: string, priority: number, permissions: string[]): void

// Remove role
removeRoleClient(roleName: string): void

// Update role permissions
updateRolePermissionsClient(roleName: string, permissions: string[]): void

// Get all roles
getAllRolesClient(): string[]

// Get role priority
getRolePriorityClient(roleName: string): number
```

### **Usage Examples**

```typescript
import { 
  addNewRoleClient, 
  removeRoleClient, 
  updateRolePermissionsClient,
  getAllRolesClient 
} from '@/lib/rbac/rbac-context';

// Add a new role
addNewRoleClient('DATA_ANALYST', 5, [
  'read.Report',
  'export.Report',
  'read.Employee',
  'read.Customer'
]);

// Update existing role permissions
updateRolePermissionsClient('EMPLOYEE', [
  'read.User',
  'read.Employee',
  'manage.Timesheet',
  'read.Project',
  'read.Report'
]);

// Remove a role
removeRoleClient('OLD_ROLE');

// List all available roles
const allRoles = getAllRolesClient();
console.log('Available roles:', allRoles);
```

## 🔄 **Database Integration**

### **Automatic Database Sync**
When you add a new role using the dynamic functions:

1. **Role is added to fallback system** - Immediate availability
2. **Database tables updated** - Persistent storage
3. **Permission assignments** - Automatic role-permission mapping

### **Database Tables Involved**
- `roles` - Role definitions
- `permissions` - Available permissions
- `role_has_permissions` - Role-permission assignments
- `model_has_roles` - User-role assignments

## 🚨 **Best Practices**

### **1. Role Naming**
- Use **UPPER_SNAKE_CASE** for consistency
- Make names **descriptive** and **clear**
- Avoid **generic names** like "USER" or "ADMIN"

### **2. Permission Assignment**
- **Start with minimal permissions** (principle of least privilege)
- **Add permissions gradually** as needed
- **Use `manage.{subject}`** for full control when appropriate

### **3. Priority Planning**
- **Plan role hierarchy** before implementation
- **Consider future roles** when assigning priorities
- **Use decimal priorities** for fine-tuning (e.g., 4.5)

### **4. Testing**
- **Test new roles** in development first
- **Verify permissions** work correctly
- **Check route access** for new roles

## 📊 **Example Role Templates**

### **Project Manager Role**
```typescript
addNewRoleClient('PROJECT_MANAGER', 4, [
  'manage.Project',
  'manage.project-task',
  'manage.project-milestone',
  'read.Employee',
  'manage.Timesheet',
  'read.Report',
  'export.Report',
  'read.Customer',
  'read.Equipment'
]);
```

### **Finance Specialist Role**
```typescript
addNewRoleClient('FINANCE_SPECIALIST', 5, [
  'read.Payroll',
  'manage.Payroll',
  'read.SalaryIncrement',
  'manage.SalaryIncrement',
  'read.Advance',
  'manage.Advance',
  'read.Report',
  'export.Report',
  'read.Employee'
]);
```

### **HR Specialist Role**
```typescript
addNewRoleClient('HR_SPECIALIST', 5, [
  'read.Employee',
  'manage.Employee',
  'manage.Leave',
  'read.performance-review',
  'manage.performance-review',
  'read.Training',
  'manage.Training',
  'read.Report',
  'read.User',
  'read.Department',
  'manage.Department'
]);
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Role Not Working**
```typescript
// Check if role was added correctly
const allRoles = getAllRolesClient();
console.log('Available roles:', allRoles);

// Verify role priority
const priority = getRolePriorityClient('YOUR_ROLE');
console.log('Role priority:', priority);
```

#### **2. Permissions Not Working**
```typescript
// Check role permissions
const rolePermissions = DYNAMIC_FALLBACK_PERMISSIONS['YOUR_ROLE'];
console.log('Role permissions:', rolePermissions);

// Verify permission format
// Should be: 'action.subject' (e.g., 'read.Employee')
```

#### **3. Route Access Issues**
```typescript
// Check if role is included in route permissions
const routePermission = routePermissions['/your-route'];
console.log('Route roles:', routePermission?.roles);

// Make sure your role is in the roles array
```

## 📈 **Advanced Features**

### **1. Role Inheritance**
```typescript
// Create a role that inherits from another
const baseRole = 'SUPERVISOR';
const newRole = 'SENIOR_SUPERVISOR';

// Copy base role permissions
const basePermissions = DYNAMIC_FALLBACK_PERMISSIONS[baseRole];
const extendedPermissions = [...basePermissions, 'manage.Budget', 'approve.Expense'];

addNewRoleClient(newRole, 3.5, extendedPermissions);
```

### **2. Dynamic Permission Updates**
```typescript
// Update permissions based on business rules
function updateRolePermissionsByDepartment(roleName: string, department: string) {
  const basePermissions = ['read.Report', 'read.Employee'];
  
  if (department === 'IT') {
    basePermissions.push('manage.Equipment', 'manage.System');
  } else if (department === 'Sales') {
    basePermissions.push('manage.Customer', 'manage.Quotation');
  }
  
  updateRolePermissionsClient(roleName, basePermissions);
}
```

## 🎉 **Summary**

The dynamic role management system provides:

✅ **Runtime role creation** - No code changes needed
✅ **Flexible permission assignment** - Granular control
✅ **Automatic database sync** - Persistent storage
✅ **Easy role management** - Add, remove, update roles
✅ **Scalable architecture** - Support for unlimited roles
✅ **Consistent API** - Same functions across client/server

**You can now create new roles on-demand without any code deployment!**
