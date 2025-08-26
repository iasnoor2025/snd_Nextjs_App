import { db } from '@/lib/drizzle';
import {
  modelHasPermissions,
  modelHasRoles,
  permissions,
  roleHasPermissions,
  roles,
  users,
} from '@/lib/drizzle/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

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

  private constructor() { }

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
  async can(userId: number, action: string, resource: string): Promise<boolean> {
    try {
      // Get user with role and permissions
      const userRows = await db
        .select({
          id: users.id,
          isActive: users.isActive,
          roleName: roles.name,
          roleId: roles.id,
        })
        .from(users)
        .leftJoin(modelHasRoles, eq(users.id, modelHasRoles.userId))
        .leftJoin(roles, eq(modelHasRoles.roleId, roles.id))
        .where(eq(users.id, userId))
        .limit(1);

      if (userRows.length === 0 || !userRows[0]) {
        return false;
      }

      const user = userRows[0];

      if (!user.isActive) {
        return false;
      }

      if (!user.roleName || !user.roleId) {
        return false;
      }

      // Check if user has the specific permission by name
      // Format: action.resource (e.g., "read.users", "create.posts")
      const permissionName = `${action}.${resource}`;

      const permissionRows = await db
        .select({
          id: permissions.id,
          name: permissions.name,
        })
        .from(permissions)
        .leftJoin(roleHasPermissions, eq(permissions.id, roleHasPermissions.permissionId))
        .where(
          and(eq(roleHasPermissions.roleId, user.roleId), eq(permissions.name, permissionName))
        )
        .limit(1);

      if (permissionRows.length === 0 || !permissionRows[0]) {
        return false;
      }

      const permission = permissionRows[0];

      if (!permission || !permission.id) {
        return false;
      }

      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Check if user can perform ANY of the specified actions
   * Similar to AccessControl's canAny() method
   */
  async canAny(userId: number, grants: PermissionGrant[]): Promise<boolean> {
    for (const grant of grants) {
      if (await this.can(userId, grant.action, grant.resource)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user can perform ALL of the specified actions
   * Similar to AccessControl's canAll() method
   */
  async canAll(userId: number, grants: PermissionGrant[]): Promise<boolean> {
    for (const grant of grants) {
      if (!(await this.can(userId, grant.action, grant.resource))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Grant permission to role
   * Similar to AccessControl's grant() method
   */
  async grant(roleName: string, resource: string, action: string): Promise<void> {
    const permissionName = `${action}.${resource}`;

    // Create permission if it doesn't exist
    const permissionResult = await db
      .insert(permissions)
      .values({
        name: permissionName,
        guardName: 'web',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .onConflictDoUpdate({
        target: permissions.name,
        set: {
          updatedAt: new Date().toISOString().split('T')[0],
        },
      })
      .returning();

    const permission = permissionResult[0];

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

    // Grant permission to role (avoid recursive call)
    if (role && permission) {
      await db
        .insert(roleHasPermissions)
        .values({
          roleId: role.id,
          permissionId: permission.id,
        })
        .onConflictDoUpdate({
          target: [roleHasPermissions.permissionId, roleHasPermissions.roleId],
          set: {},
        });
    }

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
    if (role && permission) {
      await db
        .delete(roleHasPermissions)
        .where(
          and(
            eq(roleHasPermissions.roleId, role.id),
            eq(roleHasPermissions.permissionId, permission.id)
          )
        );
    }

    // Clear cache
    this.clearCache();
  }

  /**
   * Get all permissions for a user
   * Similar to AccessControl's permissions() method
   */
  static async getPermissions(userId: number): Promise<any> {
    // Generate cache key for user permissions
    const cacheKey = generateCacheKey('permissions', 'user', { userId });
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
        try {
          // Get user roles
          const userRoles = await db
            .select({
              roleId: modelHasRoles.roleId,
            })
            .from(modelHasRoles)
            .where(eq(modelHasRoles.userId, userId));

          if (userRoles.length === 0) {
            return {
              can: () => false,
              cannot: () => true,
              permissions: [],
              roles: [],
            };
          }

          const roleIds = userRoles.map(ur => ur.roleId);

          // Get role permissions
          const rolePermissions = await db
            .select({
              permissionId: roleHasPermissions.permissionId,
              permissionName: permissions.name,
            })
            .from(roleHasPermissions)
            .innerJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
            .where(inArray(roleHasPermissions.roleId, roleIds));

          // Get role names
          const userRoleNames = await db
            .select({
              roleName: roles.name,
            })
            .from(roles)
            .where(inArray(roles.id, roleIds));

          const permissionsList = rolePermissions.map(rp => ({
            id: rp.permissionId,
            name: rp.permissionName,
            // Parse action and resource from permission name (assuming format: "action:resource")
            action: rp.permissionName.split(':')[0] || rp.permissionName,
            resource: rp.permissionName.split(':')[1] || rp.permissionName,
          }));

          const roleNames = userRoleNames.map(ur => ur.roleName);

          // Create permission checker
          const can = (action: string, resource: string): boolean => {
            return permissionsList.some(
              p => p.action === action && p.resource === resource
            );
          };

          const cannot = (action: string, resource: string): boolean => {
            return !can(action, resource);
          };

          return {
            can,
            cannot,
            permissions: permissionsList,
            roles: roleNames,
          };
        } catch (error) {
          console.error('Error fetching user permissions:', error);
          return {
            can: () => false,
            cannot: () => true,
            permissions: [],
            roles: [],
          };
        }
      },
      {
        ttl: 600, // 10 minutes - permissions change less frequently
        tags: [CACHE_TAGS.PERMISSIONS, CACHE_TAGS.ROLES, CACHE_TAGS.USERS],
      }
    );
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: number): Promise<string[]> {
    const userResult = await db
      .select({
        id: users.id,
        roleId: users.roleId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return [];
    }

    const user = userResult[0];
    if (!user) {
      return [];
    }

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

    const role = roleResult[0];
    if (!role) {
      return [];
    }
    return [role.name];
  }

  /**
   * Check if user has role
   * Similar to AccessControl's hasRole() method
   */
  async hasRole(userId: number, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(roleName);
  }

  /**
   * Check if user has any of the specified roles
   * Similar to AccessControl's hasAnyRole() method
   */
  async hasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roleNames.some(roleName => roles.includes(roleName));
  }

  /**
   * Check if user has all of the specified roles
   * Similar to AccessControl's hasAllRoles() method
   */
  async hasAllRoles(userId: number, roleNames: string[]): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roleNames.every(roleName => roles.includes(roleName));
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }
}

// Export singleton instance
export const enhancedPermissionService = EnhancedPermissionService.getInstance();

// Export a public checkPermission function for easy use in API routes
export async function checkPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  return enhancedPermissionService.can(parseInt(userId), action, resource);
}
