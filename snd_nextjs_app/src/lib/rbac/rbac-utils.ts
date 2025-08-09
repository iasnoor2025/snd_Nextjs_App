import { db } from '@/lib/db';
import { users, modelHasRoles, roles } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { hasPermission, User, Action, Subject } from './custom-rbac';

export async function getRBACPermissions(userId: string) {
  try {
    // Get user with roles and permissions
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isActive: users.isActive,
        roleName: roles.name,
        roleId: roles.id,
      })
      .from(users)
      .leftJoin(modelHasRoles, eq(modelHasRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, modelHasRoles.roleId))
      .where(eq(users.id, parseInt(userId)));
    const user = rows.length
      ? {
          id: rows[0].id,
          email: rows[0].email,
          name: rows[0].name,
          isActive: rows[0].isActive,
          role_id: rows[0].roleId,
          user_roles: rows.filter(r => r.roleName).map(r => ({ role: { name: r.roleName! } })),
          user_permissions: [],
        }
      : null;

    if (!user) {
      throw new Error('User not found');
    }

    // Create a user object for RBAC
    const userForRBAC: User = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: 'USER', // Default role
      isActive: user.isActive,
    };

    // Determine role from user_roles or role_id
    if (user.user_roles && user.user_roles.length > 0) {
      const roleHierarchy = {
        'SUPER_ADMIN': 1,
        'ADMIN': 2,
        'MANAGER': 3,
        'SUPERVISOR': 4,
        'OPERATOR': 5,
        'EMPLOYEE': 6,
        'USER': 7
      };
      
      let highestRole = 'USER';
      let highestPriority = 7;
      
      user.user_roles.forEach(userRole => {
        const roleName = userRole.role.name.toUpperCase();
        const priority = roleHierarchy[roleName as keyof typeof roleHierarchy] || 7;
        if (priority < highestPriority) {
          highestPriority = priority;
          highestRole = roleName;
        }
      });
      
      userForRBAC.role = highestRole as any;
    } else {
      // Fallback to role_id mapping
      if (user.role_id === 1) userForRBAC.role = 'SUPER_ADMIN';
      else if (user.role_id === 2) userForRBAC.role = 'ADMIN';
      else if (user.role_id === 3) userForRBAC.role = 'MANAGER';
      else if (user.role_id === 4) userForRBAC.role = 'SUPERVISOR';
      else if (user.role_id === 5) userForRBAC.role = 'OPERATOR';
      else if (user.role_id === 6) userForRBAC.role = 'EMPLOYEE';
      else if (user.role_id === 7) userForRBAC.role = 'USER';
    }

    return {
      can: (action: string, subject: string) => {
        return hasPermission(userForRBAC, action as Action, subject as Subject);
      },
      cannot: (action: string, subject: string) => {
        return !hasPermission(userForRBAC, action as Action, subject as Subject);
      },
      user: userForRBAC,
    };
  } catch (error) {
    console.error('Error getting RBAC permissions:', error);
    // Return a default ability that denies everything
    return {
      can: () => false,
      cannot: () => true,
      user: null,
    };
  }
}
