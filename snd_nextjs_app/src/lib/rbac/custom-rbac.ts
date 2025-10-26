import { db } from '@/lib/drizzle';
import { permissions, roles, roleHasPermissions, modelHasRoles } from '@/lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import' | 'sync' | 'reset';
export type Subject = string;

// Export as enums for runtime validation
export const Action = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  APPROVE: 'approve',
  REJECT: 'reject',
  EXPORT: 'export',
  IMPORT: 'import',
  SYNC: 'sync',
  RESET: 'reset'
} as const;

export const Subject = {
  USER: 'User',
  EMPLOYEE: 'Employee',
  CUSTOMER: 'Customer',
  EQUIPMENT: 'Equipment',
  RENTAL: 'Rental',
  QUOTATION: 'Quotation',
  PAYROLL: 'Payroll',
  TIMESHEET: 'Timesheet',
  PROJECT: 'Project',
  LEAVE: 'Leave',
  DEPARTMENT: 'Department',
  DESIGNATION: 'Designation',
  REPORT: 'Report',
  SETTINGS: 'Settings',
  COMPANY: 'Company',
  SAFETY: 'Safety',
  EMPLOYEE_DOCUMENT: 'employee-document',
  SALARY_INCREMENT: 'SalaryIncrement',
  ADVANCE: 'Advance',
  ASSIGNMENT: 'Assignment',
  LOCATION: 'Location',
  MAINTENANCE: 'Maintenance'
} as const;
export type UserRole = string;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface UserRoleData {
  role: {
    id: number;
    name: string;
  };
}

export interface UserForRBAC {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Load user roles from database
 */
async function loadUserRolesFromDB(userId: string): Promise<string[]> {
  try {
    // Ensure userId is a valid integer
    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) {
      console.error('Invalid user ID format:', userId);
      return [];
    }

    const userRoles = await db
      .select({
        roleName: roles.name,
      })
      .from(modelHasRoles)
      .innerJoin(roles, eq(modelHasRoles.roleId, roles.id))
      .where(eq(modelHasRoles.userId, numericUserId));

    return userRoles.map(ur => ur.roleName);
  } catch (error) {
    console.error('Error loading user roles from DB:', error);
    return [];
  }
}

/**
 * Load role permissions from database
 */
async function loadRolePermissionsFromDB(roleNames: string[]): Promise<string[]> {
  try {
    if (roleNames.length === 0) return [];

    const rolePermissions = await db
      .select({
        permissionName: permissions.name,
      })
      .from(roleHasPermissions)
      .innerJoin(roles, eq(roleHasPermissions.roleId, roles.id))
      .innerJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
      .where(inArray(roles.name, roleNames));

    return rolePermissions.map(rp => rp.permissionName);
  } catch (error) {
    console.error('Error loading role permissions from DB:', error);
    return [];
  }
}

/**
 * Create user object from session with database-driven role loading
 */
export function createUserFromSession(session: { user: { id?: string; email?: string; name?: string; role?: string; isActive?: boolean } }): User | null {
  try {
    if (!session?.user?.id) {
      return null;
    }

    const user: User = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
      role: 'USER', // Default role
      isActive: session.user.isActive !== false,
    };

    return user;
  } catch (error) {
    console.error('Error creating user from session:', error);
    return null;
  }
}

/**
 * Check if user has permission using database-driven system
 */
export async function hasPermission(user: User, action: Action, subject: Subject): Promise<boolean> {
  try {
    // Load user roles from database
    const userRoles = await loadUserRolesFromDB(user.id);
    if (userRoles.length === 0) {
      return false;
    }

    // Load permissions for user's roles
    const userPermissions = await loadRolePermissionsFromDB(userRoles);
    if (userPermissions.length === 0) {
      return false;
    }

    // Check for wildcard permissions
    if (userPermissions.includes('*') || userPermissions.includes('manage.all')) {
      return true;
    }

    // Check for specific permission
    const permissionName = `${action}.${subject}`;
    return userPermissions.includes(permissionName);
  } catch (error) {
    console.error('Error checking permission:', error);
    // Fallback to hardcoded system if database fails
    return hasPermissionFallback(user, action, subject);
  }
}

/**
 * Fallback permission system when database is unavailable
 */
function hasPermissionFallback(user: User, action: Action, subject: Subject): boolean {
  // Define fallback permissions for each role
  const fallbackPermissions: Record<string, string[]> = {
    SUPER_ADMIN: ['*', 'manage.all'],
    // ADMIN: [
    //   'manage.User', 'manage.Employee', 'manage.Customer', 'manage.Equipment',
    //   'manage.Rental', 'manage.Quotation', 'manage.Payroll', 'manage.Timesheet',
    //   'manage.Project', 'manage.Leave', 'manage.Department', 'manage.Designation',
    //   'manage.Report', 'manage.Settings', 'manage.Company', 'manage.Safety',
    //   'manage.employee-document', 'manage.SalaryIncrement', 'manage.Advance',
    //   'manage.Assignment', 'manage.Location', 'manage.Maintenance'
    // ],
    // All other roles start with empty permissions - they must be assigned dynamically
    // MANAGER: [], // Will be populated dynamically
    // SUPERVISOR: [], // Will be populated dynamically
    // OPERATOR: [], // Will be populated dynamically
    // EMPLOYEE: [], // Will be populated dynamically
    // USER: [], // Will be populated dynamically
  };

  const userPermissions = fallbackPermissions[user.role] || [];
  
  // Check for wildcard permissions
  if (userPermissions.includes('*') || userPermissions.includes('manage.all')) {
    return true;
  }

  // Check for specific permission
  const permissionName = `${action}.${subject}`;
  return userPermissions.includes(permissionName);
}

/**
 * Get user's highest priority role from database
 */
export async function getUserHighestRole(userId: string): Promise<string> {
  try {
    const userRoles = await loadUserRolesFromDB(userId);
    if (userRoles.length === 0) {
      return 'USER';
    }

    // Define role hierarchy for priority
    const roleHierarchy: Record<string, number> = {
      'SUPER_ADMIN': 1,
      'ADMIN': 2,
      'MANAGER': 3,
      'SUPERVISOR': 4,
      'OPERATOR': 5,
      'EMPLOYEE': 6,
      'USER': 7,
    };

    let highestRole = 'USER';
    let highestPriority = 7;

    userRoles.forEach(roleName => {
      const priority = roleHierarchy[roleName] || 7;
      if (priority < highestPriority) {
        highestPriority = priority;
        highestRole = roleName;
      }
    });

    return highestRole;
  } catch (error) {
    console.error('Error getting user highest role:', error);
    return 'USER';
  }
}

/**
 * Enhanced RBAC permissions function
 */
export async function getRBACPermissions(userId: string) {
  try {
    // Load user roles and permissions from database
    const userRoles = await loadUserRolesFromDB(userId);
    const userPermissions = await loadRolePermissionsFromDB(userRoles);
    const highestRole = await getUserHighestRole(userId);

    const userForRBAC: UserForRBAC = {
      id: userId,
      email: '', // Will be populated by caller if needed
      name: '', // Will be populated by caller if needed
      role: highestRole as UserRole,
      isActive: true,
    };

    return {
      can: async (action: string, subject: string) => {
        return await hasPermission(userForRBAC, action as Action, subject as Subject);
      },
      cannot: async (action: string, subject: string) => {
        return !(await hasPermission(userForRBAC, action as Action, subject as Subject));
      },
      user: userForRBAC,
      roles: userRoles,
      permissions: userPermissions,
    };
  } catch (error) {
    console.error('Error getting RBAC permissions:', error);
    // Return a default ability that denies everything
    return {
      can: async () => false,
      cannot: async () => true,
      user: null,
      roles: [],
      permissions: [],
    };
  }
}
