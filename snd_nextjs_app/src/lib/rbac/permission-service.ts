import { prisma, safePrismaOperation, ensurePrismaConnection } from '@/lib/db';
import { User, Action, Subject } from './custom-rbac';

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
    // Ensure database connection is ready
    await ensurePrismaConnection();
    
    // Get user with roles and permissions using safe operation
    const user = await safePrismaOperation(async () => {
      return await prisma.user.findUnique({
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
    });

    if (!user) {
      return {
        hasPermission: false,
        reason: 'User not found',
      };
    }

    if (!user.isActive) {
      return {
        hasPermission: false,
        reason: 'User account is inactive',
      };
    }

    // Get user's role
    const userRole = user.user_roles[0]?.role;
    if (!userRole) {
      return {
        hasPermission: false,
        reason: 'User has no assigned role',
      };
    }

    // Check direct user permissions first (these override role permissions)
    const directPermissions = user.user_permissions.map(up => up.permission.name);
    
    // Check for wildcard permissions
    if (directPermissions.includes('*') || directPermissions.includes('manage.all')) {
      return {
        hasPermission: true,
        userRole: userRole.name,
      };
    }

    // Check specific direct permissions
    const specificDirectPermission = `${action}.${subject}`;
    if (directPermissions.includes(specificDirectPermission)) {
      return {
        hasPermission: true,
        userRole: userRole.name,
      };
    }

    // Check role permissions
    const rolePermissions = userRole.role_permissions.map(rp => rp.permission.name);
    
    // Check for wildcard permissions in role
    if (rolePermissions.includes('*') || rolePermissions.includes('manage.all')) {
      return {
        hasPermission: true,
        userRole: userRole.name,
      };
    }

    // Check specific role permissions
    const specificRolePermission = `${action}.${subject}`;
    if (rolePermissions.includes(specificRolePermission)) {
      return {
        hasPermission: true,
        userRole: userRole.name,
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
        userRole: userRole.name,
      };
    }

    return {
      hasPermission: false,
      reason: `User does not have permission: ${action}.${subject}`,
      userRole: userRole.name,
      requiredPermissions: [specificRolePermission],
    };
  } catch (error) {
    console.error('Error checking user permission:', error);
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
    // Ensure database connection is ready
    await ensurePrismaConnection();
    
    const user = await safePrismaOperation(async () => {
      return await prisma.user.findUnique({
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
    });

    if (!user) return null;

    const userRole = user.user_roles[0]?.role;
    const directPermissions = user.user_permissions.map(up => up.permission.name);
    const inheritedPermissions = userRole?.role_permissions.map(rp => rp.permission.name) || [];

    return {
      userId,
      roleId: userRole?.id || 0,
      roleName: userRole?.name || 'No Role',
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
    // Ensure database connection is ready
    await ensurePrismaConnection();
    
    // Validate role exists
    const role = await safePrismaOperation(async () => {
      return await prisma.role.findUnique({
        where: { id: roleId },
      });
    });

    if (!role) {
      return { success: false, message: 'Role not found' };
    }

    // Validate permissions exist
    const permissions = await safePrismaOperation(async () => {
      return await prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      });
    });

    if (permissions.length !== permissionIds.length) {
      return { success: false, message: 'One or more permissions not found' };
    }

    // Use transaction to ensure data consistency
    await safePrismaOperation(async () => {
      return await prisma.$transaction(async (tx) => {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { role_id: roleId },
        });

        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({
              role_id: roleId,
              permission_id: permissionId,
            })),
          });
        }
      });
    });

    return { success: true, message: 'Permissions assigned successfully' };
  } catch (error) {
    console.error('Error assigning permissions to role:', error);
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
    // Ensure database connection is ready
    await ensurePrismaConnection();
    
    // Validate user exists
    const user = await safePrismaOperation(async () => {
      return await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Validate permissions exist
    const permissions = await safePrismaOperation(async () => {
      return await prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      });
    });

    if (permissions.length !== permissionIds.length) {
      return { success: false, message: 'One or more permissions not found' };
    }

    // Use transaction to ensure data consistency
    await safePrismaOperation(async () => {
      return await prisma.$transaction(async (tx) => {
        // Remove existing direct permissions
        await tx.userPermission.deleteMany({
          where: { user_id: parseInt(userId) },
        });

        // Add new direct permissions
        if (permissionIds.length > 0) {
          await tx.userPermission.createMany({
            data: permissionIds.map(permissionId => ({
              user_id: parseInt(userId),
              permission_id: permissionId,
            })),
          });
        }
      });
    });

    return { success: true, message: 'Permissions assigned successfully' };
  } catch (error) {
    console.error('Error assigning permissions to user:', error);
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
    // Ensure database connection is ready
    await ensurePrismaConnection();
    
    // Check if permission already exists
    const existingPermission = await safePrismaOperation(async () => {
      return await prisma.permission.findUnique({
        where: { name },
      });
    });

    if (existingPermission) {
      return { success: false, message: 'Permission already exists' };
    }

    // Create new permission
    const permission = await safePrismaOperation(async () => {
      return await prisma.permission.create({
        data: {
          name,
          guard_name: guardName,
        },
      });
    });

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
  permissions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  try {
    // Ensure database connection is ready
    await ensurePrismaConnection();
    
    const { search, roleId, page = 1, limit = 50 } = filters || {};
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { guard_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get permissions with pagination using safe operations
    const [permissions, total] = await Promise.all([
      safePrismaOperation(async () => {
        return await prisma.permission.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            role_permissions: {
              include: {
                role: true,
              },
            },
          },
        });
      }),
      safePrismaOperation(async () => {
        return await prisma.permission.count({ where });
      }),
    ]);

    // Filter by role if specified
    let filteredPermissions = permissions;
    if (roleId) {
      filteredPermissions = permissions.filter(permission =>
        permission.role_permissions.some(rp => rp.role_id === roleId)
      );
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
    console.error('Error getting permissions:', error);
    throw error;
  }
} 