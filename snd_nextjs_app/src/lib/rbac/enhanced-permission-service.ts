import { db } from '@/lib/drizzle';
import { users, roles, permissions, modelHasRoles, roleHasPermissions, modelHasPermissions } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface PermissionGrant {
  resource: string;
  action: string;
  attributes?: string[];
  condition?: any;
}

export interface RoleGrant {
  role: string;
  resource: string;
  action: string;
  attributes?: string[];
  condition?: any;
}

export class EnhancedPermissionService {
  private static instance: EnhancedPermissionService;
  private permissionCache: Map<string, any> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): EnhancedPermissionService {
    if (!EnhancedPermissionService.instance) {
      EnhancedPermissionService.instance = new EnhancedPermissionService();
    }
    return EnhancedPermissionService.instance;
  }

  /**
   * Check if user can perform action on resource
   * Similar to AccessControl's can() method
   */
  async can(userId: string, action: string, resource: string, attributes?: string[]): Promise<boolean> {
    const cacheKey = `${userId}:${action}:${resource}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    const result = await this.checkPermission(userId, action, resource, attributes);
    
    this.permissionCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Check if user has any of the specified permissions
   * Similar to AccessControl's canAny() method
   */
  async canAny(userId: string, grants: PermissionGrant[]): Promise<boolean> {
    for (const grant of grants) {
      if (await this.can(userId, grant.action, grant.resource, grant.attributes)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all of the specified permissions
   * Similar to AccessControl's canAll() method
   */
  async canAll(userId: string, grants: PermissionGrant[]): Promise<boolean> {
    for (const grant of grants) {
      if (!(await this.can(userId, grant.action, grant.resource, grant.attributes))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Grant permission to role
   * Similar to AccessControl's grant() method
   */
  async grant(roleName: string, resource: string, action: string, attributes?: string[]): Promise<void> {
    const permissionName = `${action}.${resource}`;
    
    // Create permission if it doesn't exist
    const [permission] = await db
      .insert(permissions)
      .values({
        name: permissionName,
        guardName: 'web',
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .onConflictDoUpdate({
        target: permissions.name,
        set: {
          updatedAt: new Date().toISOString().split('T')[0],
        },
      })
      .returning();

    // Get role
    const roleResult = await db
      .select({
        id: roles.id,
      })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);

    if (roleResult.length === 0) {
      throw new Error(`Role ${roleName} not found`);
    }

    const role = roleResult[0];

    // Grant permission to role
    await db
      .insert(roleHasPermissions)
      .values({
        permissionId: permission.id,
        roleId: role.id,
      })
      .onConflictDoNothing();

    // Clear cache
    this.clearCache();
  }

  /**
   * Revoke permission from role
   * Similar to AccessControl's revoke() method
   */
  async revoke(roleName: string, resource: string, action: string): Promise<void> {
    const permissionName = `${action}.${resource}`;
    
    const permissionResult = await db
      .select({
        id: permissions.id,
      })
      .from(permissions)
      .where(eq(permissions.name, permissionName))
      .limit(1);

    if (permissionResult.length === 0) {
      return; // Permission doesn't exist, nothing to revoke
    }

    const permission = permissionResult[0];

    const roleResult = await db
      .select({
        id: roles.id,
      })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);

    if (roleResult.length === 0) {
      return; // Role doesn't exist, nothing to revoke
    }

    const role = roleResult[0];

    // Revoke permission from role
    await db
      .delete(roleHasPermissions)
      .where(
        and(
          eq(roleHasPermissions.roleId, role.id),
          eq(roleHasPermissions.permissionId, permission.id)
        )
      );

    // Clear cache
    this.clearCache();
  }

  /**
   * Get all permissions for a user
   * Similar to AccessControl's permissions() method
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const userIdInt = parseInt(userId);
    
    const userResult = await db
      .select({
        id: users.id,
        roleId: users.roleId,
      })
      .from(users)
      .where(eq(users.id, userIdInt))
      .limit(1);

    if (userResult.length === 0) {
      return [];
    }

    const user = userResult[0];
    const userPermissionsSet = new Set<string>();

    // Add role permissions
    const rolePermissions = await db
      .select({
        permissionName: permissions.name as any,
      })
      .from(roleHasPermissions)
      .innerJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
      .where(eq(roleHasPermissions.roleId, user.roleId));

    for (const rolePermission of rolePermissions) {
      userPermissionsSet.add(rolePermission.permissionName);
    }

    // Add direct user permissions (override role permissions)
    const userPermissions = await db
      .select({
        permissionName: permissions.name as any,
      })
      .from(modelHasPermissions)
      .innerJoin(permissions, eq(modelHasPermissions.permissionId, permissions.id))
      .where(eq(modelHasPermissions.userId, userIdInt));

    for (const userPermission of userPermissions) {
      userPermissionsSet.add(userPermission.permissionName);
    }

    return Array.from(userPermissionsSet);
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const userIdInt = parseInt(userId);
    
    const userResult = await db
      .select({
        id: users.id,
        roleId: users.roleId,
      })
      .from(users)
      .where(eq(users.id, userIdInt))
      .limit(1);

    if (userResult.length === 0) {
      return [];
    }

    const user = userResult[0];

    // Get user's role
    const roleResult = await db
      .select({
        name: roles.name,
      })
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);

    if (roleResult.length === 0) {
      return [];
    }

    return [roleResult[0].name];
  }

  /**
   * Check if user has role
   * Similar to AccessControl's hasRole() method
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(roleName);
  }

  /**
   * Check if user has any of the specified roles
   * Similar to AccessControl's hasAnyRole() method
   */
  async hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roleNames.some(roleName => roles.includes(roleName));
  }

  /**
   * Check if user has all of the specified roles
   * Similar to AccessControl's hasAllRoles() method
   */
  async hasAllRoles(userId: string, roleNames: string[]): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roleNames.every(roleName => roles.includes(roleName));
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Private method to check specific permission
   */
  private async checkPermission(userId: string, action: string, resource: string, attributes?: string[]): Promise<boolean> {
    try {
      const userIdInt = parseInt(userId);
      
      // Get user with role
      const user = await db
        .select({
          id: users.id,
          roleId: users.roleId,
        })
        .from(users)
        .where(eq(users.id, userIdInt))
        .limit(1);

      if (user.length === 0) {
        return false;
      }

      const userRole = user[0];

      // Check direct user permissions first (override role permissions)
      const userPermissions = await db
        .select({
          permissionName: permissions.name as any,
        })
        .from(modelHasPermissions)
        .innerJoin(permissions, eq(modelHasPermissions.permissionId, permissions.id))
        .where(eq(modelHasPermissions.userId, userIdInt));

      for (const userPermission of userPermissions) {
        if (this.matchesPermission(userPermission.permissionName, action, resource)) {
          return true;
        }
      }

      // Check role permissions
      const rolePermissions = await db
        .select({
          permissionName: permissions.name as any,
        })
        .from(roleHasPermissions)
        .innerJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
        .where(eq(roleHasPermissions.roleId, userRole.roleId));

      for (const rolePermission of rolePermissions) {
        if (this.matchesPermission(rolePermission.permissionName, action, resource)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if permission name matches action and resource
   */
  private matchesPermission(permissionName: string, action: string, resource: string): boolean {
    // Exact match
    if (permissionName === `${action}.${resource}`) {
      return true;
    }

    // Wildcard permissions
    if (permissionName === '*' || permissionName === 'manage.all') {
      return true;
    }

    // General resource permission (e.g., "manage.timesheet" matches "approve.timesheet")
    if (permissionName === `manage.${resource}`) {
      return true;
    }

    // General action permission (e.g., "approve.timesheet" matches "approve.timesheet.foreman")
    if (permissionName === `${action}.${resource}`) {
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const enhancedPermissionService = EnhancedPermissionService.getInstance();

// Export a public checkPermission function for easy use in API routes
export async function checkPermission(userId: string, resource: string, action: string, attributes?: string[]): Promise<boolean> {
  return enhancedPermissionService.can(userId, action, resource, attributes);
} 
