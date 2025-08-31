import { db } from '@/lib/db';
import { permissions, roles, roleHasPermissions, modelHasRoles } from '@/lib/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import' | 'sync' | 'reset';
export type Subject = string;
export type UserRole = string;

export interface RoutePermission {
  action: Action;
  subject: Subject;
  roles: UserRole[];
}

export interface UserPermissions {
  userId: number;
  roles: string[];
  permissions: string[];
}

/**
 * Load all permissions from database
 */
export async function loadAllPermissions() {
  try {
    const allPermissions = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        guardName: permissions.guardName,
      })
      .from(permissions);

    return allPermissions;
  } catch (error) {
    console.error('Error loading permissions:', error);
    return [];
  }
}

/**
 * Load all roles from database
 */
export async function loadAllRoles() {
  try {
    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        guardName: roles.guardName,
      })
      .from(roles);

    return allRoles;
  } catch (error) {
    console.error('Error loading roles:', error);
    return [];
  }
}

/**
 * Load role permissions mapping from database
 */
export async function loadRolePermissions() {
  try {
    const rolePermissions = await db
      .select({
        roleId: roleHasPermissions.roleId,
        permissionId: roleHasPermissions.permissionId,
        roleName: roles.name,
        permissionName: permissions.name,
      })
      .from(roleHasPermissions)
      .innerJoin(roles, eq(roleHasPermissions.roleId, roles.id))
      .innerJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id));

    // Group by role
    const rolePermissionsMap: Record<string, string[]> = {};
    rolePermissions.forEach(rp => {
      if (!rolePermissionsMap[rp.roleName]) {
        rolePermissionsMap[rp.roleName] = [];
      }
      rolePermissionsMap[rp.roleName].push(rp.permissionName);
    });

    return rolePermissionsMap;
  } catch (error) {
    console.error('Error loading role permissions:', error);
    return {};
  }
}

/**
 * Load user roles and permissions from database
 */
export async function loadUserPermissions(userId: number): Promise<UserPermissions | null> {
  try {
    // Get user roles
    const userRoles = await db
      .select({
        roleId: modelHasRoles.roleId,
        roleName: roles.name,
      })
      .from(modelHasRoles)
      .innerJoin(roles, eq(modelHasRoles.roleId, roles.id))
      .where(eq(modelHasRoles.userId, userId));

    if (userRoles.length === 0) {
      return null;
    }

    const roleIds = userRoles.map(ur => ur.roleId);
    const roleNames = userRoles.map(ur => ur.roleName);

    // Get permissions for user's roles
    const userPermissions = await db
      .select({
        permissionName: permissions.name,
      })
      .from(roleHasPermissions)
      .innerJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
      .where(inArray(roleHasPermissions.roleId, roleIds));

    const permissionNames = userPermissions.map(up => up.permissionName);

    return {
      userId,
      roles: roleNames,
      permissions: permissionNames,
    };
  } catch (error) {
    console.error('Error loading user permissions:', error);
    return null;
  }
}

/**
 * Check if user has specific permission
 */
export async function checkUserPermission(userId: number, action: Action, subject: Subject): Promise<boolean> {
  try {
    const userPerms = await loadUserPermissions(userId);
    if (!userPerms) return false;

    // Check for wildcard permissions
    if (userPerms.permissions.includes('*') || userPerms.permissions.includes('manage.all')) {
      return true;
    }

    // Check for specific permission
    const permissionName = `${action}.${subject}`;
    return userPerms.permissions.includes(permissionName);
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Check if user has any of the required roles
 */
export async function checkUserRoles(userId: number, requiredRoles: string[]): Promise<boolean> {
  try {
    const userPerms = await loadUserPermissions(userId);
    if (!userPerms) return false;

    // Check if user has any of the required roles
    return requiredRoles.some(role => userPerms.roles.includes(role));
  } catch (error) {
    console.error('Error checking user roles:', error);
    return false;
  }
}

/**
 * Get dynamic route permissions based on database
 */
export async function getDynamicRoutePermissions(pathname: string): Promise<RoutePermission | null> {
  try {
    // Load all permissions and roles from database
    const allPermissions = await loadAllPermissions();
    const allRoles = await loadAllRoles();
    const rolePermissions = await loadRolePermissions();

    // Define route permission mappings based on database data
    const routeMappings: Record<string, { action: Action; subject: Subject; permissionPattern: string }> = {
      '/dashboard': { action: 'read', subject: 'Settings', permissionPattern: 'read.Settings' },
      '/employee-dashboard': { action: 'read', subject: 'Employee', permissionPattern: 'read.Employee' },
      '/modules/employee-management': { action: 'read', subject: 'Employee', permissionPattern: 'read.Employee' },
      '/modules/customer-management': { action: 'read', subject: 'Customer', permissionPattern: 'read.Customer' },
      '/modules/equipment-management': { action: 'read', subject: 'Equipment', permissionPattern: 'read.Equipment' },
      '/modules/maintenance-management': { action: 'read', subject: 'Maintenance', permissionPattern: 'read.Maintenance' },
      '/modules/company-management': { action: 'manage', subject: 'Company', permissionPattern: 'manage.Company' },
      '/modules/rental-management': { action: 'read', subject: 'Rental', permissionPattern: 'read.Rental' },
      '/modules/quotation-management': { action: 'read', subject: 'Quotation', permissionPattern: 'read.Quotation' },
      '/modules/payroll-management': { action: 'read', subject: 'Payroll', permissionPattern: 'read.Payroll' },
      '/modules/timesheet-management': { action: 'read', subject: 'Timesheet', permissionPattern: 'read.Timesheet' },
      '/modules/project-management': { action: 'read', subject: 'Project', permissionPattern: 'read.Project' },
      '/modules/leave-management': { action: 'read', subject: 'Leave', permissionPattern: 'read.Leave' },
      '/modules/location-management': { action: 'read', subject: 'Settings', permissionPattern: 'read.Settings' },
      '/modules/user-management': { action: 'read', subject: 'User', permissionPattern: 'read.User' },
  
      '/modules/safety-management': { action: 'read', subject: 'Safety', permissionPattern: 'read.Safety' },
      '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', permissionPattern: 'read.SalaryIncrement' },
      '/modules/reporting': { action: 'read', subject: 'Report', permissionPattern: 'read.Report' },
      '/modules/settings': { action: 'read', subject: 'Settings', permissionPattern: 'read.Settings' },
  
      '/admin': { action: 'manage', subject: 'Settings', permissionPattern: 'manage.Settings' },
      '/reports': { action: 'read', subject: 'Report', permissionPattern: 'read.Report' },
    };

    const routeConfig = routeMappings[pathname];
    if (!routeConfig) {
      return null; // No permission required for this route
    }

    // Find roles that have the required permission
    const allowedRoles: string[] = [];
    Object.entries(rolePermissions).forEach(([roleName, permissions]) => {
      if (permissions.includes(routeConfig.permissionPattern) || 
          permissions.includes('*') || 
          permissions.includes('manage.all')) {
        allowedRoles.push(roleName);
      }
    });

    // If no roles found with specific permission, fall back to basic role-based access
    if (allowedRoles.length === 0) {
      // Fallback: Use basic role hierarchy
      const basicRoles = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'];
      allowedRoles.push(...basicRoles);
    }

    return {
      action: routeConfig.action,
      subject: routeConfig.subject,
      roles: allowedRoles,
    };
  } catch (error) {
    console.error('Error getting dynamic route permissions:', error);
    // Fallback to basic permissions if database fails
    return getFallbackRoutePermissions(pathname);
  }
}

/**
 * Fallback route permissions when database is unavailable
 */
function getFallbackRoutePermissions(pathname: string): RoutePermission | null {
  const fallbackConfigs: Record<string, RoutePermission> = {
    '/dashboard': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/employee-dashboard': { action: 'read', subject: 'Employee', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/employee-management': { action: 'read', subject: 'Employee', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/customer-management': { action: 'read', subject: 'Customer', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/equipment-management': { action: 'read', subject: 'Equipment', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/maintenance-management': { action: 'read', subject: 'Maintenance', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/company-management': { action: 'manage', subject: 'Company', roles: ['SUPER_ADMIN', 'ADMIN'] },
    '/modules/rental-management': { action: 'read', subject: 'Rental', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/quotation-management': { action: 'read', subject: 'Quotation', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/payroll-management': { action: 'read', subject: 'Payroll', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/timesheet-management': { action: 'read', subject: 'Timesheet', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/project-management': { action: 'read', subject: 'Project', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/leave-management': { action: 'read', subject: 'Leave', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/location-management': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/user-management': { action: 'read', subject: 'User', roles: ['SUPER_ADMIN', 'ADMIN'] },

    '/modules/safety-management': { action: 'read', subject: 'Safety', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/reporting': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/settings': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },

    '/admin': { action: 'manage', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
    '/reports': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
  };

  return fallbackConfigs[pathname] || null;
}
