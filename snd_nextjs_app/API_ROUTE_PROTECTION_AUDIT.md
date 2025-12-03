# API Route Protection Audit

## Executive Summary

This audit identifies API routes that need permission protection upgrades to ensure consistent security across the application.

## Protection Status Overview

| Status | Count | Action Required |
|--------|-------|----------------|
| ✅ Well Protected (`withPermission`) | ~154+ routes | None |
| ⚠️ Needs Upgrade (`withAuth`) | ~30 routes | Upgrade to `withPermission()` |
| ⚠️ Manual Checks | ~19 routes | Upgrade to `withPermission()` |
| ❌ No Protection | ~6 routes | Add protection |

## Routes Requiring Immediate Attention

### ✅ High Priority Routes - COMPLETED

The following routes have been upgraded:
- ✅ `/api/equipment/categories/seed` → `withPermission(PermissionConfigs.settings.manage)`
- ✅ `/api/countries` → `withReadPermission('Settings')`
- ✅ `/api/pdf-proxy` → `withReadPermission('Document')`
- ✅ `/api/employee-dashboard` → `withPermission(PermissionConfigs.dashboard.read)`

See `ROUTE_UPGRADES_COMPLETED.md` for details.

---

### ⚠️ Routes Using `withAuth()` (Needs Upgrade)

These routes only check authentication but not permissions:

**Chat & Notifications**:
- `/api/chat/*` - All chat endpoints
- `/api/notifications/*` - All notification endpoints
- `/api/sse` - Server-sent events

**User Profile**:
- `/api/profile/*` - Profile management
- `/api/user/*` - User settings
- `/api/upload` - File upload
- `/api/upload-supabase` - Supabase upload

**Employee Self-Service**:
- `/api/employee/*` - Employee self-service endpoints

**Migration Example**:
```typescript
// Before
import { withAuth } from '@/lib/rbac/api-middleware';
export const GET = withAuth(async (request) => { ... });

// After
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
export const GET = withPermission(PermissionConfigs['own-profile'].read)(async (request) => { ... });
```

### ⚠️ Routes with Manual Session Checks (Needs Upgrade)

**Dashboard & Permissions**:
- `/api/employee-dashboard` → Use `PermissionConfigs.dashboard.read`
- `/api/user-permissions` → Use `PermissionConfigs.user.read`

**Sync Operations**:
- `/api/customers/sync` → Use `PermissionConfigs.customer.sync`
- `/api/customers/sync/enhanced` → Use `PermissionConfigs.customer.sync`
- `/api/equipment/sync` → Use `PermissionConfigs.equipment.sync`
- `/api/billing/sync-invoices` → Use appropriate billing permission

**Migration Example**:
```typescript
// Before
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Handler code
}

// After
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
export const GET = withPermission(PermissionConfigs.customer.read)(async (request: NextRequest) => {
  // Handler code (session check handled by middleware)
});
```

### ❌ Routes with No Protection (Security Risk)

**Admin/System Routes**:
- `/api/equipment/categories/seed` → Use `PermissionConfigs.settings.manage`
- `/api/countries` → Use `PermissionConfigs.settings.read`

**Document/PDF Routes**:
- `/api/pdf-proxy` → Use `PermissionConfigs.document.read`
- `/api/pdfjs-worker` → Public asset (OK, but verify)

**Add Protection Example**:
```typescript
// Before
export async function GET(request: NextRequest) {
  // No protection
  // Handler code
}

// After
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
export const GET = withPermission(PermissionConfigs.settings.read)(async (request: NextRequest) => {
  // Handler code
});
```

## Recommended Permission Mappings

### Chat & Notifications
```typescript
// Chat endpoints
PermissionConfigs.document.read  // For chat media
// Or create new: PermissionConfigs.chat.read

// Notifications
PermissionConfigs['own-profile'].read  // Users can read their own notifications
```

### Profile & User Settings
```typescript
PermissionConfigs['own-profile'].read   // Read own profile
PermissionConfigs['own-profile'].update // Update own profile
```

### File Uploads
```typescript
PermissionConfigs.document.upload  // For document uploads
// Or: PermissionConfigs['employee-document'].create
```

### Sync Operations
```typescript
PermissionConfigs.customer.sync    // Customer sync
PermissionConfigs.equipment.sync   // Equipment sync
// Add billing.sync if needed
```

## Quick Reference: Protection Methods

### ✅ Recommended: `withPermission()`
```typescript
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.employee.read)(async (request) => {
  // Handler
});
```

### ⚠️ Deprecated: `withAuth()`
```typescript
// Only checks authentication, not permissions
// Upgrade to withPermission() for proper access control
```

### ❌ Not Recommended: Manual Checks
```typescript
// Manual session checks inside handler
// Upgrade to withPermission() for consistency
```

## Implementation Priority

### High Priority (Security Risk)
1. Routes with no protection
2. Admin/system routes using `withAuth()`
3. File upload routes

### Medium Priority (Consistency)
1. Chat & notification routes
2. Profile routes
3. Sync operation routes

### Low Priority (Nice to Have)
1. Dashboard routes (may have custom logic)
2. Public endpoints (verify they should be public)

## Migration Checklist

For each route to upgrade:

- [ ] Identify appropriate permission from `PermissionConfigs`
- [ ] Replace `withAuth()` or manual checks with `withPermission()`
- [ ] Remove redundant session checks (middleware handles it)
- [ ] Remove manual 401/403 responses (middleware handles it)
- [ ] Test with different user roles
- [ ] Verify error responses (401 for auth, 403 for permissions)
- [ ] Update any related frontend code if needed

## Testing Strategy

1. **Test as SUPER_ADMIN**: Should have access to all routes
2. **Test as ADMIN**: Should have access to most routes
3. **Test as EMPLOYEE**: Should have limited access
4. **Test as USER**: Should have minimal access
5. **Test Unauthenticated**: Should return 401
6. **Test Insufficient Permissions**: Should return 403

## Available Permission Configs

See `src/lib/rbac/api-middleware.ts` for complete list. Common ones:

- `PermissionConfigs.employee.*`
- `PermissionConfigs.customer.*`
- `PermissionConfigs.equipment.*`
- `PermissionConfigs.project.*`
- `PermissionConfigs.timesheet.*`
- `PermissionConfigs['own-profile'].*`
- `PermissionConfigs.document.*`
- `PermissionConfigs.settings.*`

## Notes

- Public endpoints (auth routes) should remain unprotected
- Some routes may need custom permission logic (document exceptions)
- Always prefer specific permissions over broad ones
- Test thoroughly after migration

---

**Last Updated**: After RBAC improvements
**Next Review**: After migration completion

