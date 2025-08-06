import { prisma } from '@/lib/db';

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
    const permission = await prisma.permission.upsert({
      where: { name: permissionName },
      update: {},
      create: {
        name: permissionName,
        guard_name: 'web',
      },
    });

    // Get role
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    // Grant permission to role
    await prisma.rolePermission.upsert({
      where: {
        permission_id_role_id: {
          permission_id: permission.id,
          role_id: role.id,
        },
      },
      update: {},
      create: {
        permission_id: permission.id,
        role_id: role.id,
      },
    });

    // Clear cache
    this.clearCache();
  }

  /**
   * Revoke permission from role
   * Similar to AccessControl's revoke() method
   */
  async revoke(roleName: string, resource: string, action: string): Promise<void> {
    const permissionName = `${action}.${resource}`;
    
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      return; // Permission doesn't exist, nothing to revoke
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return; // Role doesn't exist, nothing to revoke
    }

    // Revoke permission from role
    await prisma.rolePermission.deleteMany({
      where: {
        role_id: role.id,
        permission_id: permission.id,
      },
    });

    // Clear cache
    this.clearCache();
  }

  /**
   * Get all permissions for a user
   * Similar to AccessControl's permissions() method
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        user_roles: {
          include: {
            role: {
              include: {
                role_permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        user_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const permissions = new Set<string>();

    // Add role permissions
    for (const userRole of user.user_roles) {
      for (const rolePermission of userRole.role.role_permissions) {
        permissions.add(rolePermission.permission.name);
      }
    }

    // Add direct user permissions (override role permissions)
    for (const userPermission of user.user_permissions) {
      permissions.add(userPermission.permission.name);
    }

    return Array.from(permissions);
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    return user.user_roles.map(userRole => userRole.role.name);
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
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: {
          user_roles: {
            include: {
              role: {
                include: {
                  role_permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
          user_permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!user) {
        return false;
      }

      // Check direct user permissions first (override role permissions)
      for (const userPermission of user.user_permissions) {
        const permissionName = userPermission.permission.name;
        if (this.matchesPermission(permissionName, action, resource)) {
          return true;
        }
      }

      // Check role permissions
      for (const userRole of user.user_roles) {
        for (const rolePermission of userRole.role.role_permissions) {
          const permissionName = rolePermission.permission.name;
          if (this.matchesPermission(permissionName, action, resource)) {
            return true;
          }
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