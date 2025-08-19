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
import { Action, Subject, User } from './custom-rbac';

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
  try {
    // Fetch user role and permissions via Drizzle
    const userRows = await db
      .select({
        id: users.id,
        isActive: users.isActive,
        roleId: roles.id,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(modelHasRoles, eq(modelHasRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, modelHasRoles.roleId))
      .where(eq(users.id, parseInt(userId)));

    if (userRows.length === 0 || !userRows[0]) {
      return { hasPermission: false, reason: 'User not found' };
    }

    const user = userRows[0];
    const isActive = user.isActive;
    if (!isActive) {
      return { hasPermission: false, reason: 'User account is inactive' };
    }

    const roleName = user.roleName || 'USER';
    const roleId = user.roleId;

    // Direct user permissions
    const directPermRows = await db
      .select({ name: permissionsTable.name })
      .from(modelHasPermissions)
      .leftJoin(permissionsTable, eq(permissionsTable.id, modelHasPermissions.permissionId))
      .where(eq(modelHasPermissions.userId, parseInt(userId)));
    const directPermissions = directPermRows.map(r => r.name!).filter(Boolean);

    // Get user's role
    if (!roleName || !roleId) {
      return { hasPermission: false, reason: 'User has no assigned role' };
    }

    // Check direct user permissions first (these override role permissions)
    // directPermissions already computed

    // Check for wildcard permissions
    if (directPermissions.includes('*') || directPermissions.includes('manage.all')) {
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
    const rolePermRows = await db
      .select({ name: permissionsTable.name })
      .from(roleHasPermissions)
      .leftJoin(permissionsTable, eq(permissionsTable.id, roleHasPermissions.permissionId))
      .where(eq(roleHasPermissions.roleId, roleId));
    const rolePermissions = rolePermRows.map(r => r.name!).filter(Boolean);

    // Check for wildcard permissions in role
    if (rolePermissions.includes('*') || rolePermissions.includes('manage.all')) {
      return {
        hasPermission: true,
        userRole: roleName,
      };
    }

    // Check specific role permissions
    const specificRolePermission = `${action}.${subject}`;
    if (rolePermissions.includes(specificRolePermission)) {
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

    if (broaderPermissions.length > 0) {
      return {
        hasPermission: true,
        userRole: roleName,
      };
    }

    return {
      hasPermission: false,
      reason: `User does not have permission: ${action}.${subject}`,
      userRole: roleName,
      requiredPermissions: [specificRolePermission],
    };
  } catch (error) {
    
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
    const userRows = await db
      .select({
        id: users.id,
        roleId: roles.id,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(modelHasRoles, eq(modelHasRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, modelHasRoles.roleId))
      .where(eq(users.id, parseInt(userId)));
    if (userRows.length === 0 || !userRows[0]) return null;

    // User rows already validated above
    const user = userRows[0];
    const roleId = user.roleId || 0;
    const roleName = user?.roleName || 'No Role';
    const directPermRows2 = await db
      .select({ name: permissionsTable.name })
      .from(modelHasPermissions)
      .leftJoin(permissionsTable, eq(permissionsTable.id, modelHasPermissions.permissionId))
      .where(eq(modelHasPermissions.userId, parseInt(userId)));
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
    // Assign direct permissions via Drizzle
    await db.delete(modelHasPermissions).where(eq(modelHasPermissions.userId, parseInt(userId)));
    if (permissionIds.length > 0) {
      await db
        .insert(modelHasPermissions)
        .values(permissionIds.map(pid => ({ userId: parseInt(userId), permissionId: pid })));
    }

    return { success: true, message: 'Permissions assigned successfully' };
  } catch (error) {
    
    return { success: false, message: 'Error assigning permissions' };
  }
}

/**
 * Create a new permission
 */
export async function createPermission(
  name: string,
  guardName: string = 'web'
): Promise<{ success: boolean; message: string; permission?: any }> {
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
  permissions: any[];
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
