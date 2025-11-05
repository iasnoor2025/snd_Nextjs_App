import { db } from '@/lib/drizzle';
import {
  modelHasPermissions,
  modelHasRoles,
  permissions as permissionsTable,
  roleHasPermissions,
  roles,
  users,
} from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { Action, Subject } from './server-rbac';

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  userRole?: string;
  requiredPermissions?: string[];
}

// Server-side permission cache
const PERMISSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const permissionCache = new Map<string, { result: PermissionCheck; timestamp: number }>();

// Cache key for permission checks
function getPermissionCacheKey(userId: string, action: Action, subject: Subject): string {
  return `perm:${userId}:${action}:${subject}`;
}

// Get cached permission check
function getCachedPermissionCheck(userId: string, action: Action, subject: Subject): PermissionCheck | null {
  const cacheKey = getPermissionCacheKey(userId, action, subject);
  const cached = permissionCache.get(cacheKey);
  
  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp < PERMISSION_CACHE_TTL) {
      return cached.result;
    } else {
      // Cache expired
      permissionCache.delete(cacheKey);
    }
  }
  
  return null;
}

// Set cached permission check
function setCachedPermissionCheck(userId: string, action: Action, subject: Subject, result: PermissionCheck): void {
  const cacheKey = getPermissionCacheKey(userId, action, subject);
  permissionCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });
}

// Clear cache for a user (when permissions change)
export function clearUserPermissionCache(userId: string): void {
  const keysToDelete: string[] = [];
  for (const key of permissionCache.keys()) {
    if (key.startsWith(`perm:${userId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => permissionCache.delete(key));
}

export interface UserPermissions {
  userId: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  directPermissions: string[];
  inheritedPermissions: string[];
}

/**
 * Check if a user has a specific permission
 * This function checks both direct user permissions and role-based permissions
 * Uses server-side caching to avoid repeated database queries
 */
export async function checkUserPermission(
  userId: string,
  action: Action,
  subject: Subject
): Promise<PermissionCheck> {
  // Check cache first
  const cached = getCachedPermissionCheck(userId, action, subject);
  if (cached) {
    // Silent cache hit - no logging
    return cached;
  }

  try {
    // Parse user ID
    const parsedUserId = parseInt(userId);
    
    if (isNaN(parsedUserId)) {
      const result = { hasPermission: false, reason: 'Invalid user ID format' };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }
    
    // First, try to get user with direct roleId (from users table)
    const userRows = await db
      .select({
        id: users.id,
        isActive: users.isActive,
        directRoleId: users.roleId,
      })
      .from(users)
      .where(eq(users.id, parsedUserId));

    if (userRows.length === 0 || !userRows[0]) {
      const result = { hasPermission: false, reason: 'User not found' };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }

    const user = userRows[0];
    const isActive = user.isActive;
    if (!isActive) {
      const result = { hasPermission: false, reason: 'User account is inactive' };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }

    // Get role information - try direct roleId first, then modelHasRoles
    let roleId: number | null = user.directRoleId;
    let roleName = 'USER';

    if (roleId) {
      // Get role name from direct roleId
      const roleRows = await db
        .select({ name: roles.name })
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);
      
      if (roleRows.length > 0 && roleRows[0]) {
        roleName = roleRows[0].name || 'USER';
      }
    } else {
      // Fallback to modelHasRoles if no direct roleId
      const modelRoleRows = await db
        .select({
          roleId: roles.id,
          roleName: roles.name,
        })
        .from(modelHasRoles)
        .leftJoin(roles, eq(roles.id, modelHasRoles.roleId))
        .where(eq(modelHasRoles.userId, parsedUserId))
        .limit(1);
      
      if (modelRoleRows.length > 0 && modelRoleRows[0]) {
        roleId = modelRoleRows[0].roleId;
        roleName = modelRoleRows[0].roleName || 'USER';
      }
    }

    // Direct user permissions
    const directPermRows = await db
      .select({ name: permissionsTable.name })
      .from(modelHasPermissions)
      .leftJoin(permissionsTable, eq(permissionsTable.id, modelHasPermissions.permissionId))
      .where(eq(modelHasPermissions.userId, parsedUserId));
    const directPermissions = directPermRows.map(r => r.name!).filter(Boolean);

    // Get user's role
    if (!roleName || !roleId) {
      const result = { hasPermission: false, reason: 'User has no assigned role' };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }

    // Check direct user permissions first (these override role permissions)
    // directPermissions already computed

    // Check for wildcard permissions
    if (directPermissions.includes('*') || directPermissions.includes('manage.all')) {
      const result = {
        hasPermission: true,
        userRole: roleName,
      };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }

    // Check specific direct permissions
    const specificDirectPermission = `${action}.${subject}`;
    if (directPermissions.includes(specificDirectPermission)) {
      const result = {
        hasPermission: true,
        userRole: roleName,
      };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }

    // Check role permissions
    if (!roleId) {
      const result = { hasPermission: false, reason: 'User has no assigned role' };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }
    
    const rolePermRows = await db
      .select({ name: permissionsTable.name })
      .from(roleHasPermissions)
      .leftJoin(permissionsTable, eq(permissionsTable.id, roleHasPermissions.permissionId))
      .where(eq(roleHasPermissions.roleId, roleId));
    const rolePermissions = rolePermRows.map(r => r.name!).filter(Boolean);

    // Check for wildcard permissions in role
    if (rolePermissions.includes('*') || rolePermissions.includes('manage.all')) {
      const result = {
        hasPermission: true,
        userRole: roleName,
      };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }

    // Check specific role permissions
    const specificRolePermission = `${action}.${subject}`;
    if (rolePermissions.includes(specificRolePermission)) {
      const result = {
        hasPermission: true,
        userRole: roleName,
      };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }

    // Check for broader permissions (e.g., if user has 'manage.employee', they can 'read.employee')
    const broaderPermissions = rolePermissions.filter(p => {
      if (p === 'manage.all') return true;
      if (p === `manage.${subject}`) return true;
      if (p === specificRolePermission) return true;
      return false;
    });

    if (broaderPermissions.length > 0) {
      const result = {
        hasPermission: true,
        userRole: roleName,
      };
      setCachedPermissionCheck(userId, action, subject, result);
      return result;
    }

    const result = {
      hasPermission: false,
      reason: `User does not have permission: ${action}.${subject}`,
      userRole: roleName,
      requiredPermissions: [specificRolePermission],
    };
    setCachedPermissionCheck(userId, action, subject, result);
    return result;
  } catch (error) {
    // Only log errors, not normal permission checks
    console.error(`Error checking permissions for user ${userId}:`, error);
    
    const result = {
      hasPermission: false,
      reason: 'Error checking permissions',
    };
    // Don't cache errors
    return result;
  }
}

/**
 * Get all permissions for a user (both direct and role-based)
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  try {
    // Parse user ID
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return null;
    }
    
    const userRows = await db
      .select({
        id: users.id,
        roleId: roles.id,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(modelHasRoles, eq(modelHasRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, modelHasRoles.roleId))
      .where(eq(users.id, parsedUserId));
    if (userRows.length === 0 || !userRows[0]) return null;

    // User rows already validated above
    const user = userRows[0];
    const roleId = user.roleId || 0;
    const roleName = user?.roleName || 'No Role';
    const directPermRows2 = await db
      .select({ name: permissionsTable.name })
      .from(modelHasPermissions)
      .leftJoin(permissionsTable, eq(permissionsTable.id, modelHasPermissions.permissionId))
      .where(eq(modelHasPermissions.userId, parsedUserId));
    const directPermissions = directPermRows2.map(r => r.name!).filter(Boolean);
    const rolePermRows2 = await db
      .select({ name: permissionsTable.name })
      .from(roleHasPermissions)
      .leftJoin(permissionsTable, eq(permissionsTable.id, roleHasPermissions.permissionId))
      .where(eq(roleHasPermissions.roleId, roleId));
    const inheritedPermissions = rolePermRows2.map(r => r.name!).filter(Boolean);

    return {
      userId,
      roleId,
      roleName,
      permissions: [...new Set([...directPermissions, ...inheritedPermissions])],
      directPermissions,
      inheritedPermissions,
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return null;
  }
}

/**
 * Assign permissions to a role
 */
export async function assignPermissionsToRole(
  roleId: number,
  permissionIds: number[]
): Promise<{ success: boolean; message: string }> {
  try {
    // Remove existing and assign permissions via Drizzle
    await db.delete(roleHasPermissions).where(eq(roleHasPermissions.roleId, roleId));
    if (permissionIds.length > 0) {
      await db
        .insert(roleHasPermissions)
        .values(permissionIds.map(pid => ({ roleId, permissionId: pid })));
    }

    // Clear all permission caches since role permissions changed
    permissionCache.clear();

    return { success: true, message: 'Permissions assigned successfully' };
  } catch (error) {
    console.error('Error assigning permissions:', error);
    return { success: false, message: 'Error assigning permissions' };
  }
}

/**
 * Assign permissions directly to a user
 */
export async function assignPermissionsToUser(
  userId: string,
  permissionIds: number[]
): Promise<{ success: boolean; message: string }> {
  try {
    // Parse user ID
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return { success: false, message: 'Invalid user ID format' };
    }
    
    // Assign direct permissions via Drizzle
    await db.delete(modelHasPermissions).where(eq(modelHasPermissions.userId, parsedUserId));
    if (permissionIds.length > 0) {
      await db
        .insert(modelHasPermissions)
        .values(permissionIds.map(pid => ({ userId: parsedUserId, permissionId: pid })));
    }

    // Clear cache for this user
    clearUserPermissionCache(userId);

    return { success: true, message: 'Permissions assigned successfully' };
  } catch (error) {
    console.error('Error assigning permissions:', error);
    return { success: false, message: 'Error assigning permissions' };
  }
}

/**
 * Create a new permission
 */
export async function createPermission(
  name: string,
  guardName: string = 'web'
): Promise<{ success: boolean; message: string; permission?: { name: string; id: number; createdAt: string; updatedAt: string; guardName: string } | undefined }> {
  try {
    // Check if permission already exists
    const existing = await db
      .select({ id: permissionsTable.id })
      .from(permissionsTable)
      .where(eq(permissionsTable.name, name));

    if (existing.length > 0) {
      return { success: false, message: 'Permission already exists' };
    }

    // Create new permission
    const inserted = await db
      .insert(permissionsTable)
      .values({ name, guardName, updatedAt: new Date().toISOString() })
      .returning();
    const permission = inserted[0];

    return { success: true, message: 'Permission created successfully', permission };
  } catch (error) {
    console.error('Error creating permission:', error);
    return { success: false, message: 'Error creating permission' };
  }
}

/**
 * Get all permissions with optional filtering
 */
export async function getPermissions(filters?: {
  search?: string;
  roleId?: number;
  page?: number;
  limit?: number;
}): Promise<{
  permissions: Array<{ id: number; name: string; guardName: string; createdAt: string; updatedAt: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  try {
    const { search, roleId, page = 1, limit = 50 } = filters || {};
    // const skip = (page - 1) * limit;

    // Build where clause
    // Fetch permissions via Drizzle and filter in-memory for search
    const permRows = await db.select().from(permissionsTable);
    const permissions = permRows.filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return p.name?.toLowerCase().includes(s) || p.guardName?.toLowerCase().includes(s);
    });
    const total = permissions.length;

    // Filter by role if specified
    let filteredPermissions = permissions;
    if (roleId) {
      const rolePerms = await db
        .select()
        .from(roleHasPermissions)
        .where(eq(roleHasPermissions.roleId, roleId));
      const allowedIds = new Set(rolePerms.map(rp => rp.permissionId));
      filteredPermissions = permissions.filter(p => allowedIds.has(p.id));
    }

    return {
      permissions: filteredPermissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    
    throw error;
  }
}
