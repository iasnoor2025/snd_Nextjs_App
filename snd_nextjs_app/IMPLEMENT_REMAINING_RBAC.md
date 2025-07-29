# RBAC Implementation Guide for Remaining Pages

## ✅ **Completed Pages (8/18 - 44.4%)**
1. ✅ Employee Management
2. ✅ Customer Management  
3. ✅ Equipment Management
4. ✅ Rental Management
5. ✅ Payroll Management
6. ✅ Timesheet Management
7. ✅ Project Management
8. ✅ RBAC Test Page
9. ✅ Access Denied Page

## ⏳ **Remaining Pages (10/18 - 55.6%)**

### **High Priority Pages**

#### **1. Analytics** (`/modules/analytics`)
```tsx
// Add to imports
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';

// Add to component
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('Report');

// Wrap with ProtectedRoute
<ProtectedRoute requiredPermission={{ action: 'read', subject: 'Report' }}>
  {/* Page content */}
</ProtectedRoute>

// Add conditional buttons
<Can action="export" subject="Report">
  <Button variant="outline">
    <Download className="h-4 w-4 mr-2" />
    Export Analytics
  </Button>
</Can>

<RoleBased roles={['ADMIN', 'MANAGER']}>
  <Card>
    <CardHeader>
      <CardTitle>Analytics Administration</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="Report">
        <Button variant="outline">Advanced Analytics</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

#### **2. User Management** (`/modules/user-management`)
```tsx
// Add to imports
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';

// Add to component
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('User');

// Wrap with ProtectedRoute
<ProtectedRoute requiredPermission={{ action: 'manage', subject: 'User' }}>
  {/* Page content */}
</ProtectedRoute>

// Add conditional buttons
<Can action="create" subject="User">
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Add User
  </Button>
</Can>

<Can action="manage" subject="User">
  <Button variant="outline">
    <Settings className="h-4 w-4 mr-2" />
    User Settings
  </Button>
</Can>

<RoleBased roles={['ADMIN']}>
  <Card>
    <CardHeader>
      <CardTitle>User Administration</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="User">
        <Button variant="outline">Role Management</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

#### **3. Settings** (`/modules/settings`)
```tsx
// Add to imports
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';

// Add to component
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('Settings');

// Wrap with ProtectedRoute
<ProtectedRoute requiredPermission={{ action: 'manage', subject: 'Settings' }}>
  {/* Page content */}
</ProtectedRoute>

// Add conditional sections
<Can action="manage" subject="Settings">
  <Card>
    <CardHeader>
      <CardTitle>System Settings</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Settings content */}
    </CardContent>
  </Card>
</Can>

<RoleBased roles={['ADMIN']}>
  <Card>
    <CardHeader>
      <CardTitle>Advanced Settings</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="Settings">
        <Button variant="outline">System Configuration</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

#### **4. Reporting** (`/modules/reporting`)
```tsx
// Add to imports
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';

// Add to component
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('Report');

// Wrap with ProtectedRoute
<ProtectedRoute requiredPermission={{ action: 'read', subject: 'Report' }}>
  {/* Page content */}
</ProtectedRoute>

// Add conditional buttons
<Can action="export" subject="Report">
  <Button variant="outline">
    <Download className="h-4 w-4 mr-2" />
    Export Report
  </Button>
</Can>

<Can action="create" subject="Report">
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Create Report
  </Button>
</Can>

<RoleBased roles={['ADMIN', 'MANAGER']}>
  <Card>
    <CardHeader>
      <CardTitle>Report Administration</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="Report">
        <Button variant="outline">Report Templates</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

### **Medium Priority Pages**

#### **5. Quotation Management** (`/modules/quotation-management`)
```tsx
// Add to imports
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';

// Add to component
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('Quotation');

// Wrap with ProtectedRoute
<ProtectedRoute requiredPermission={{ action: 'read', subject: 'Quotation' }}>
  {/* Page content */}
</ProtectedRoute>

// Add conditional buttons
<Can action="create" subject="Quotation">
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Create Quotation
  </Button>
</Can>

<Can action="approve" subject="Quotation">
  <Button variant="outline">
    <CheckCircle className="h-4 w-4 mr-2" />
    Approve Quotations
  </Button>
</Can>

<RoleBased roles={['ADMIN', 'MANAGER']}>
  <Card>
    <CardHeader>
      <CardTitle>Quotation Administration</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="Quotation">
        <Button variant="outline">Quotation Settings</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

#### **6. Notifications** (`/modules/notifications`)
```tsx
// Add to imports
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';

// Add to component
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('Notification');

// Wrap with ProtectedRoute
<ProtectedRoute requiredPermission={{ action: 'read', subject: 'Notification' }}>
  {/* Page content */}
</ProtectedRoute>

// Add conditional buttons
<Can action="manage" subject="Notification">
  <Button variant="outline">
    <Settings className="h-4 w-4 mr-2" />
    Notification Settings
  </Button>
</Can>

<RoleBased roles={['ADMIN']}>
  <Card>
    <CardHeader>
      <CardTitle>Notification Administration</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="Notification">
        <Button variant="outline">System Notifications</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

#### **7. Safety Management** (`/modules/safety-management`)
```tsx
// Add to imports
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';

// Add to component
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('Safety');

// Wrap with ProtectedRoute
<ProtectedRoute requiredPermission={{ action: 'read', subject: 'Safety' }}>
  {/* Page content */}
</ProtectedRoute>

// Add conditional buttons
<Can action="create" subject="Safety">
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Create Safety Report
  </Button>
</Can>

<Can action="approve" subject="Safety">
  <Button variant="outline">
    <CheckCircle className="h-4 w-4 mr-2" />
    Approve Reports
  </Button>
</Can>

<RoleBased roles={['ADMIN', 'SAFETY_OFFICER']}>
  <Card>
    <CardHeader>
      <CardTitle>Safety Administration</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="Safety">
        <Button variant="outline">Safety Settings</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

### **Lower Priority Pages**

#### **8. Leave Management** (`/modules/leave-management`)
```tsx
// Add to imports
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';

// Add to component
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('Leave');

// Wrap with ProtectedRoute
<ProtectedRoute requiredPermission={{ action: 'read', subject: 'Leave' }}>
  {/* Page content */}
</ProtectedRoute>

// Add conditional buttons
<Can action="create" subject="Leave">
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Request Leave
  </Button>
</Can>

<Can action="approve" subject="Leave">
  <Button variant="outline">
    <CheckCircle className="h-4 w-4 mr-2" />
    Approve Leave
  </Button>
</Can>

<RoleBased roles={['ADMIN', 'HR_MANAGER']}>
  <Card>
    <CardHeader>
      <CardTitle>Leave Administration</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="Leave">
        <Button variant="outline">Leave Settings</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

#### **9. Company Management** (`/modules/company-management`)
```tsx
// Add to imports
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';

// Add to component
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('Company');

// Wrap with ProtectedRoute
<ProtectedRoute requiredPermission={{ action: 'manage', subject: 'Company' }}>
  {/* Page content */}
</ProtectedRoute>

// Add conditional buttons
<Can action="manage" subject="Company">
  <Button variant="outline">
    <Settings className="h-4 w-4 mr-2" />
    Company Settings
  </Button>
</Can>

<RoleBased roles={['ADMIN']}>
  <Card>
    <CardHeader>
      <CardTitle>Company Administration</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="Company">
        <Button variant="outline">System Configuration</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

## 🎯 **Implementation Pattern for All Pages**

### **Step 1: Add Imports**
```tsx
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
```

### **Step 2: Add RBAC Hooks**
```tsx
const { user, hasPermission, getAllowedActions } = useRBAC();
const allowedActions = getAllowedActions('Subject');
```

### **Step 3: Wrap with ProtectedRoute**
```tsx
<ProtectedRoute requiredPermission={{ action: 'read', subject: 'Subject' }}>
  {/* Page content */}
</ProtectedRoute>
```

### **Step 4: Add Conditional Rendering**
```tsx
<Can action="create" subject="Subject">
  <Button>Add New</Button>
</Can>

<Can action="export" subject="Subject">
  <Button variant="outline">Export</Button>
</Can>
```

### **Step 5: Add Role-Based Content**
```tsx
<RoleBased roles={['ADMIN', 'MANAGER']}>
  <Card>
    <CardHeader>
      <CardTitle>Administration</CardTitle>
    </CardHeader>
    <CardContent>
      <Can action="manage" subject="Subject">
        <Button variant="outline">Settings</Button>
      </Can>
    </CardContent>
  </Card>
</RoleBased>
```

## 🚀 **Quick Implementation Commands**

For each remaining page, follow this pattern:

1. **Add imports** at the top of the file
2. **Add RBAC hooks** in the component
3. **Wrap the main return** with `ProtectedRoute`
4. **Add conditional buttons** using `<Can>` components
5. **Add role-based content** using `<RoleBased>` components
6. **Add closing tag** for `ProtectedRoute`

## ✅ **Expected Result**

After implementing RBAC on all remaining pages:
- **18/18 pages (100%)** will have RBAC protection
- **Route-level security** via middleware
- **Component-level security** via conditional rendering
- **Role-based content** for different user types
- **Permission-based actions** for all CRUD operations
- **Consistent user experience** across all modules

**The RBAC system will be 100% complete and production-ready!** 
