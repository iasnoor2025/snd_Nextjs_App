import { db } from '@/lib/db';
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
 */
export async function checkUserPermission(
  userId: string,
  action: Action,
  subject: Subject
): Promise<PermissionCheck> {
  console.log(`🔐 Checking permission: ${action}.${subject} for user ${userId}`);
  try {
    // Fetch user role and permissions via Drizzle
    console.log(`🔍 Fetching user data for ID: ${userId}`);
    
    // Debug: Check if userId can be parsed as integer
    const parsedUserId = parseInt(userId);
    console.log(`🔢 Parsed user ID: ${parsedUserId} (original: ${userId}, type: ${typeof userId})`);
    
    if (isNaN(parsedUserId)) {
      console.log(`❌ Invalid user ID: ${userId} cannot be parsed as integer`);
      return { hasPermission: false, reason: 'Invalid user ID format' };
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

    console.log(`📊 User rows found:`, userRows);

    if (userRows.length === 0 || !userRows[0]) {
      console.log(`❌ User not found: ${userId}`);
      return { hasPermission: false, reason: 'User not found' };
    }

    const user = userRows[0];
    const isActive = user.isActive;
    if (!isActive) {
      return { hasPermission: false, reason: 'User account is inactive' };
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

    console.log(`📊 Final role info:`, { roleId, roleName });

    // Direct user permissions
    const directPermRows = await db
      .select({ name: permissionsTable.name })
      .from(modelHasPermissions)
      .leftJoin(permissionsTable, eq(permissionsTable.id, modelHasPermissions.permissionId))
      .where(eq(modelHasPermissions.userId, parsedUserId));
    const directPermissions = directPermRows.map(r => r.name!).filter(Boolean);

    // Get user's role
    if (!roleName || !roleId) {
      return { hasPermission: false, reason: 'User has no assigned role' };
    }

    // Check direct user permissions first (these override role permissions)
    // directPermissions already computed

    // Check for wildcard permissions
    console.log(`🔐 Direct permissions:`, directPermissions);
    if (directPermissions.includes('*') || directPermissions.includes('manage.all')) {
      console.log(`✅ User has wildcard permission`);
      return {
        hasPermission: true,
        userRole: roleName,
      };
    }

    // Check specific direct permissions
    const specificDirectPermission = `${action}.${subject}`;
    if (directPermissions.includes(specificDirectPermission)) {
      return {
        hasPermission: true,
        userRole: roleName,
      };
    }

    // Check role permissions
    console.log(`🔍 Fetching role permissions for role ID: ${roleId}`);
    
    if (!roleId) {
      console.log(`❌ No role ID found for user ${userId}`);
      return { hasPermission: false, reason: 'User has no assigned role' };
    }
    
    const rolePermRows = await db
      .select({ name: permissionsTable.name })
      .from(roleHasPermissions)
      .leftJoin(permissionsTable, eq(permissionsTable.id, roleHasPermissions.permissionId))
      .where(eq(roleHasPermissions.roleId, roleId));
    const rolePermissions = rolePermRows.map(r => r.name!).filter(Boolean);
    console.log(`🔐 Role permissions:`, rolePermissions);

    // Check for wildcard permissions in role
    if (rolePermissions.includes('*') || rolePermissions.includes('manage.all')) {
      return {
        hasPermission: true,
        userRole: roleName,
      };
    }

    // Check specific role permissions
    const specificRolePermission = `${action}.${subject}`;
    console.log(`🔍 Checking for specific permission: ${specificRolePermission}`);
    if (rolePermissions.includes(specificRolePermission)) {
      console.log(`✅ User has specific role permission: ${specificRolePermission}`);
      return {
        hasPermission: true,
        userRole: roleName,
      };
    }

    // Check for broader permissions (e.g., if user has 'manage.employee', they can 'read.employee')
    const broaderPermissions = rolePermissions.filter(p => {
      if (p === 'manage.all') return true;
      if (p === `manage.${subject}`) return true;
      if (p === specificRolePermission) return true;
      return false;
    });

    console.log(`🔍 Broader permissions found:`, broaderPermissions);

    if (broaderPermissions.length > 0) {
      console.log(`✅ User has broader permission`);
      return {
        hasPermission: true,
        userRole: roleName,
      };
    }

    console.log(`❌ User does not have permission: ${action}.${subject}`);
    return {
      hasPermission: false,
      reason: `User does not have permission: ${action}.${subject}`,
      userRole: roleName,
      requiredPermissions: [specificRolePermission],
    };
  } catch (error) {
    console.error(`❌ Error checking permissions for user ${userId}:`, error);
    
    return {
      hasPermission: false,
      reason: 'Error checking permissions',
    };
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
