/**
 * @deprecated This file is deprecated. Use server-rbac.ts instead.
 * Re-exporting getRBACPermissions from server-rbac.ts for backward compatibility.
 * 
 * This file will be removed in a future version.
 * Please update imports to use '@/lib/rbac/server-rbac' instead.
 */

// Re-export from server-rbac.ts (the main implementation)
export { getRBACPermissions } from './server-rbac';
