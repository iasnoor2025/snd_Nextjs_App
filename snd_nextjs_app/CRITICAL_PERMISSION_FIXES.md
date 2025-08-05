# Critical Permission Fixes - Implementation Guide

## 🚨 **IMMEDIATE FIXES NEEDED**

### 1. **Employee GET Route** ✅ **FIXED**
- **File**: `/api/employees/route.ts`
- **Status**: ✅ **COMPLETED**
- **Change**: Added `withPermission` middleware to GET route

### 2. **User Management** ✅ **FIXED**
- **File**: `/api/users/route.ts`
- **Status**: ✅ **COMPLETED**
- **Change**: Added `withPermission` middleware to all routes (GET, POST, PUT, DELETE)

```typescript
// Add to /api/users/route.ts
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(
  async () => {
    // Existing GET logic
  },
  PermissionConfigs.user.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
    // Existing POST logic
  },
  PermissionConfigs.user.create
);

export const PUT = withPermission(
  async (request: NextRequest) => {
    // Existing PUT logic
  },
  PermissionConfigs.user.update
);

export const DELETE = withPermission(
  async (request: NextRequest) => {
    // Existing DELETE logic
  },
  PermissionConfigs.user.delete
);
```

### 3. **Customer Management** ✅ **FIXED**
- **File**: `/api/customers/route.ts`
- **Status**: ✅ **COMPLETED**
- **Change**: Added `withPermission` middleware to GET and POST routes

```typescript
// Add to /api/customers/route.ts
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(
  async (request: NextRequest) => {
    // Existing GET logic
  },
  PermissionConfigs.customer.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
    // Existing POST logic
  },
  PermissionConfigs.customer.create
);
```

### 4. **Equipment Management** ✅ **FIXED**
- **File**: `/api/equipment/route.ts`
- **Status**: ✅ **COMPLETED**
- **Change**: Added `withPermission` middleware to all routes (GET, POST, PUT, DELETE)

```typescript
// Add to /api/equipment/route.ts
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(
  async (request: NextRequest) => {
    // Existing GET logic
  },
  PermissionConfigs.equipment.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
    // Existing POST logic
  },
  PermissionConfigs.equipment.create
);

export const PUT = withPermission(
  async (request: NextRequest) => {
    // Existing PUT logic
  },
  PermissionConfigs.equipment.update
);

export const DELETE = withPermission(
  async (request: NextRequest) => {
    // Existing DELETE logic
  },
  PermissionConfigs.equipment.delete
);
```

## 🔧 **IMPLEMENTATION STEPS**

### **Step 1: Fix Critical Routes (Week 1)** ✅ **COMPLETED**
1. ✅ Employee GET route - **COMPLETED**
2. ✅ User management routes - **COMPLETED**
3. ✅ Customer management routes - **COMPLETED**
4. ✅ Equipment management routes - **COMPLETED**

### **Step 2: Core Business Functions (Week 2)**
1. ❌ Rental management
2. ❌ Payroll management
3. ❌ Project management
4. ❌ Leave management

### **Step 3: Administrative Functions (Week 3)**
1. ❌ Department management
2. ❌ Designation management
3. ❌ Settings management
4. ❌ Report management

## 📋 **CHECKLIST FOR EACH ROUTE**

For each API route that needs permission implementation:

- [ ] **Import middleware**: `import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';`
- [ ] **Wrap GET route**: `export const GET = withPermission(async (request) => { ... }, PermissionConfigs.[resource].read);`
- [ ] **Wrap POST route**: `export const POST = withPermission(async (request) => { ... }, PermissionConfigs.[resource].create);`
- [ ] **Wrap PUT route**: `export const PUT = withPermission(async (request) => { ... }, PermissionConfigs.[resource].update);`
- [ ] **Wrap DELETE route**: `export const DELETE = withPermission(async (request) => { ... }, PermissionConfigs.[resource].delete);`
- [ ] **Test with different user roles**
- [ ] **Verify permission denied for unauthorized users**

## 🎯 **PRIORITY ORDER**

### **CRITICAL (Fix Immediately)** ✅ **COMPLETED**
1. ✅ Employee GET route - **COMPLETED**
2. ✅ User management - **COMPLETED**
3. ✅ Customer management - **COMPLETED**
4. ✅ Equipment management - **COMPLETED**

### **HIGH PRIORITY (Week 1)**
1. ❌ Rental management
2. ❌ Payroll management
3. ❌ Project management

### **MEDIUM PRIORITY (Week 2)**
1. ❌ Leave management
2. ❌ Department management
3. ❌ Designation management

### **LOW PRIORITY (Week 3)**
1. ❌ Settings management
2. ❌ Report management
3. ❌ Company management
4. ❌ Location management

## 🚀 **QUICK START**

To implement permissions for any route:

1. **Add import**:
```typescript
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
```

2. **Wrap existing route**:
```typescript
// Before
export const GET = async (request: NextRequest) => {
  // existing logic
};

// After
export const GET = withPermission(
  async (request: NextRequest) => {
    // existing logic
  },
  PermissionConfigs.[resource].read
);
```

3. **Test the route** with different user roles to ensure permissions work correctly.

## ⚠️ **IMPORTANT NOTES**

- **Don't break existing functionality** - Keep all existing logic intact
- **Test thoroughly** - Ensure all user roles can access appropriate data
- **Check error handling** - Verify 403 errors for unauthorized access
- **Update documentation** - Document which permissions are required for each route

This systematic approach will ensure all critical security vulnerabilities are addressed while maintaining application functionality. 