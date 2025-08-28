// Server-side RBAC utilities - only import in server components and API routes
import { db } from '@/lib/db';
import { permissions, roles, roleHasPermissions, modelHasRoles } from '@/lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import' | 'sync' | 'reset';
export type Subject = string;
export type UserRole = string;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface UserPermissions {
  userId: number;
  roles: string[];
  permissions: string[];
}

/**
 * Permission mapping from API format to database format
 * This maps the simple API permission names to the actual database permission names
 */
export const PERMISSION_MAPPING: Record<string, string[]> = {
  // User permissions
  'read.User': ['read.user'],
  'create.User': ['create.user'],
  'update.User': ['update.user'],
  'delete.User': ['delete.user'],
  'manage.User': ['manage.user'],

  // Employee permissions
  'read.Employee': ['read.employee', 'read.employee-data'],
  'create.Employee': ['create.employee', 'create.employee-data'],
  'update.Employee': ['update.employee', 'update.employee-data'],
  'delete.Employee': ['delete.employee', 'delete.employee-data'],
  'manage.Employee': ['manage.employee', 'manage.employee-data'],

  // Customer permissions
  'read.Customer': ['read.customer'],
  'create.Customer': ['create.customer'],
  'update.Customer': ['update.customer'],
  'delete.Customer': ['delete.customer'],
  'manage.Customer': ['manage.customer'],

  // Equipment permissions
  'read.Equipment': ['read.equipment'],
  'create.Equipment': ['create.equipment'],
  'update.Equipment': ['update.equipment'],
  'delete.Equipment': ['delete.equipment'],
  'manage.Equipment': ['manage.equipment'],

  // Project permissions
  'read.Project': ['read.project'],
  'create.Project': ['create.project'],
  'update.Project': ['update.project'],
  'delete.Project': ['delete.project'],
  'manage.Project': ['manage.project'],

  // Rental permissions
  'read.Rental': ['read.rental'],
  'create.Rental': ['create.rental'],
  'update.Rental': ['update.rental'],
  'delete.Rental': ['delete.rental'],
  'manage.Rental': ['manage.rental'],

  // Quotation permissions
  'read.Quotation': ['read.quotation'],
  'create.Quotation': ['create.quotation'],
  'update.Quotation': ['update.quotation'],
  'delete.Quotation': ['delete.quotation'],
  'manage.Quotation': ['manage.quotation'],

  // Payroll permissions
  'read.Payroll': ['read.payroll'],
  'create.Payroll': ['create.payroll'],
  'update.Payroll': ['update.payroll'],
  'delete.Payroll': ['delete.payroll'],
  'manage.Payroll': ['manage.payroll'],

  // Timesheet permissions
  'read.Timesheet': ['read.timesheet'],
  'create.Timesheet': ['create.timesheet'],
  'update.Timesheet': ['update.timesheet'],
  'delete.Timesheet': ['delete.timesheet'],
  'manage.Timesheet': ['manage.timesheet'],
  'approve.Timesheet': ['approve.timesheet'],
  'reject.Timesheet': ['reject.timesheet'],

  // Leave permissions
  'read.Leave': ['read.leave'],
  'create.Leave': ['create.leave'],
  'update.Leave': ['update.leave'],
  'delete.Leave': ['delete.leave'],
  'manage.Leave': ['manage.leave'],

  // Department permissions
  'read.Department': ['read.department'],
  'create.Department': ['create.department'],
  'update.Department': ['update.department'],
  'delete.Department': ['delete.department'],
  'manage.Department': ['manage.department'],

  // Designation permissions
  'read.Designation': ['read.designation'],
  'create.Designation': ['create.designation'],
  'update.Designation': ['update.designation'],
  'delete.Designation': ['delete.designation'],
  'manage.Designation': ['manage.designation'],

  // Company permissions
  'read.Company': ['read.company'],
  'create.Company': ['create.company'],
  'update.Company': ['update.company'],
  'delete.Company': ['delete.company'],
  'manage.Company': ['manage.company'],

  // Settings permissions
  'read.Settings': ['read.settings', 'read.system-setting'],
  'create.Settings': ['create.settings', 'create.system-setting'],
  'update.Settings': ['update.settings', 'update.system-setting'],
  'delete.Settings': ['delete.settings', 'delete.system-setting'],
  'manage.Settings': ['manage.settings', 'manage.system-setting'],

  // Location permissions
  'read.Location': ['read.location'],
  'create.Location': ['create.location'],
  'update.Location': ['update.location'],
  'delete.Location': ['delete.location'],
  'manage.Location': ['manage.location'],

  // Maintenance permissions
  'read.Maintenance': ['read.maintenance'],
  'create.Maintenance': ['create.maintenance'],
  'update.Maintenance': ['update.maintenance'],
  'delete.Maintenance': ['delete.maintenance'],
  'manage.Maintenance': ['manage.maintenance'],

  // Safety permissions
  'read.Safety': ['read.safety'],
  'create.Safety': ['create.safety'],
  'update.Safety': ['update.safety'],
  'delete.Safety': ['delete.safety'],
  'manage.Safety': ['manage.safety'],

  // SalaryIncrement permissions
  'read.SalaryIncrement': ['read.salaryincrement'],
  'create.SalaryIncrement': ['create.salaryincrement'],
  'update.SalaryIncrement': ['update.salaryincrement'],
  'delete.SalaryIncrement': ['delete.salaryincrement'],
  'manage.SalaryIncrement': ['manage.salaryincrement'],

  // Advance permissions
  'read.Advance': ['read.advance'],
  'create.Advance': ['create.advance'],
  'update.Advance': ['update.advance'],
  'delete.Advance': ['delete.advance'],
  'manage.Advance': ['manage.advance'],

  // Assignment permissions
  'read.Assignment': ['read.assignment'],
  'create.Assignment': ['create.assignment'],
  'update.Assignment': ['update.assignment'],
  'delete.Assignment': ['delete.assignment'],
  'manage.Assignment': ['manage.assignment'],

  // Report permissions
  'read.Report': ['read.report'],
  'create.Report': ['create.report'],
  'update.Report': ['update.report'],
  'delete.Report': ['delete.report'],
  'manage.Report': ['manage.report'],
  'export.Report': ['export.report'],

  // Employee-document permissions
  'read.employee-document': ['read.employee-document'],
  'create.employee-document': ['create.employee-document'],
  'update.employee-document': ['update.employee-document'],
  'delete.employee-document': ['delete.employee-document'],
  'manage.employee-document': ['manage.employee-document'],

  // Document Management permissions
  'read.Document': ['read.document'],
  'create.Document': ['create.document'],
  'update.Document': ['update.document'],
  'delete.Document': ['delete.document'],
  'manage.Document': ['manage.document'],
  'upload.Document': ['upload.document'],
  'download.Document': ['download.document'],
  'approve.Document': ['approve.document'],
  'reject.Document': ['reject.document'],

  // Document Version permissions
  'read.document-version': ['read.document-version'],
  'create.document-version': ['create.document-version'],
  'update.document-version': ['update.document-version'],
  'delete.document-version': ['delete.document-version'],
  'manage.document-version': ['manage.document-version'],

  // Document Approval permissions
  'read.document-approval': ['read.document-approval'],
  'create.document-approval': ['create.document-approval'],
  'update.document-approval': ['update.document-approval'],
  'delete.document-approval': ['delete.document-approval'],
  'manage.document-approval': ['manage.document-approval'],
  'approve.document-approval': ['approve.document-approval'],
  'reject.document-approval': ['reject.document-approval'],

  // Wildcard permissions
  '*': ['*'],
  'manage.all': ['manage.all'],
};

/**
 * Dynamic role hierarchy configuration
 * This can be moved to database or environment variables for easy updates
 */
export const DYNAMIC_ROLE_HIERARCHY: Record<string, number> = {
  'SUPER_ADMIN': 1,
  'ADMIN': 2,
  'MANAGER': 3,
  'SUPERVISOR': 4,
  'OPERATOR': 5,
  'EMPLOYEE': 6,
  'USER': 7,
  // Add new roles here with appropriate priority numbers
  // Lower number = higher priority
};

/**
 * Dynamic fallback permissions configuration
 * This can be moved to database or environment variables for easy updates
 * Uses database permission names for fallback
 */
export const DYNAMIC_FALLBACK_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*', 'manage.all'],
  ADMIN: [
    'manage.user', 'manage.employee-data', 'manage.customer', 'manage.equipment',
    'manage.rental', 'manage.quotation', 'manage.payroll', 'manage.timesheet',
    'manage.project', 'manage.leave', 'manage.department', 'manage.designation',
    'manage.report', 'manage.settings', 'manage.company', 'manage.safety',
    'manage.employee-document', 'manage.salaryincrement', 'approve.salaryincrement', 'reject.salaryincrement', 'apply.salaryincrement', 'manage.advance',
    'manage.assignment', 'manage.location', 'manage.maintenance'
  ],
  MANAGER: [
    'read.user', 'manage.employee-data', 'manage.customer', 'manage.equipment',
    'manage.rental', 'manage.quotation', 'read.payroll', 'manage.timesheet',
    'manage.project', 'manage.leave', 'read.department', 'read.designation',
    'read.report', 'read.settings', 'read.company', 'read.safety',
    'manage.employee-document', 'manage.salaryincrement', 'approve.salaryincrement', 'reject.salaryincrement', 'apply.salaryincrement', 'manage.advance',
    'manage.assignment', 'read.location', 'read.maintenance', 'manage.document', 'read.document-version', 'read.document-approval'
  ],
  SUPERVISOR: [
    'read.user', 'manage.employee-data', 'read.customer', 'read.equipment',
    'read.rental', 'manage.quotation', 'read.payroll', 'manage.timesheet',
    'manage.project', 'manage.leave', 'read.department', 'read.designation',
    'read.report', 'read.settings', 'read.company', 'read.safety',
    'manage.employee-document', 'read.salaryincrement', 'read.advance',
    'read.assignment', 'read.location', 'read.maintenance', 'read.document', 'read.document-version', 'read.document-approval'
  ],
  OPERATOR: [
    'read.user', 'read.employee-data', 'read.customer', 'read.equipment',
    'read.rental', 'read.quotation', 'read.payroll', 'read.timesheet',
    'read.project', 'read.leave', 'read.department', 'read.designation',
    'read.report', 'read.settings', 'read.company', 'read.safety',
    'read.employee-document', 'read.salaryincrement', 'read.advance',
    'read.assignment', 'read.location', 'read.maintenance', 'read.document', 'read.document-version', 'read.document-approval'
  ],
  EMPLOYEE: [
    'read.user', 'read.employee-data', 'read.customer', 'read.equipment',
    'read.rental', 'read.quotation', 'read.payroll', 'manage.timesheet',
    'read.project', 'manage.leave', 'read.department', 'read.designation',
    'read.report', 'read.settings', 'read.company', 'manage.employee-document',
    'read.salaryincrement', 'read.document', 'read.document-version', 'read.document-approval'
  ],
  USER: [
    'read.user', 'read.employee-data', 'read.customer', 'read.equipment',
    'read.rental', 'read.quotation', 'read.timesheet', 'read.project',
    'read.leave', 'read.department', 'read.settings', 'read.report',
    'read.company', 'read.employee-document', 'read.salaryincrement', 'read.document', 'read.document-version', 'read.document-approval'
  ],
  // Add new roles here with their permissions
  // Example:
  // PROJECT_LEADER: ['manage.project', 'manage.project-task', 'read.employee-data', 'read.timesheet'],
  // FINANCE_SPECIALIST: ['read.payroll', 'read.salaryincrement', 'read.report', 'export.report'],
  // HR_SPECIALIST: ['read.employee-data', 'manage.leave', 'read.report', 'read.user'],
};

/**
 * Load user roles from database
 */
export async function loadUserRolesFromDB(userId: string): Promise<string[]> {
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
export async function loadRolePermissionsFromDB(roleNames: string[]): Promise<string[]> {
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

    // Check for specific permission using mapping
    const permissionName = `${action}.${subject}`;
    const mappedPermissions = PERMISSION_MAPPING[permissionName] || [permissionName];
    
    // Check if user has any of the mapped permissions
    return mappedPermissions.some(permission => userPermissions.includes(permission));
  } catch (error) {
    console.error('Error checking permission:', error);
    // Fallback to dynamic system if database fails
    return hasPermissionFallback(user, action, subject);
  }
}

/**
 * Dynamic fallback permission system when database is unavailable
 * Now supports new roles through configuration
 */
function hasPermissionFallback(user: User, action: Action, subject: Subject): boolean {
  // SUPER_ADMIN should have access to everything
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Get permissions for user's role from dynamic configuration
  const userPermissions = DYNAMIC_FALLBACK_PERMISSIONS[user.role] || [];
  
  // Check for wildcard permissions
  if (userPermissions.includes('*') || userPermissions.includes('manage.all')) {
    return true;
  }

  // Check for specific permission using mapping
  const permissionName = `${action}.${subject}`;
  const mappedPermissions = PERMISSION_MAPPING[permissionName] || [permissionName];
  
  // Check if user has any of the mapped permissions
  return mappedPermissions.some(permission => userPermissions.includes(permission));
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

    // Use dynamic role hierarchy for priority
    let highestRole = 'USER';
    let highestPriority = DYNAMIC_ROLE_HIERARCHY['USER'] || 999;

    userRoles.forEach(roleName => {
      const priority = DYNAMIC_ROLE_HIERARCHY[roleName] || 999;
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

    return {
      can: async (action: string, subject: string) => {
        return await hasPermission({ id: userId, email: '', name: '', role: highestRole as UserRole, isActive: true }, action as Action, subject as Subject);
      },
      cannot: async (action: string, subject: string) => {
        return !(await hasPermission({ id: userId, email: '', name: '', role: highestRole as UserRole, isActive: true }, action as Action, subject as Subject));
      },
      user: { id: userId, email: '', name: '', role: highestRole as UserRole, isActive: true },
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

/**
 * Check if user has required role using dynamic hierarchy
 */
export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const userRoleLevel = DYNAMIC_ROLE_HIERARCHY[userRole] || 999;

  return requiredRoles.some(requiredRole => {
    const requiredRoleLevel = DYNAMIC_ROLE_HIERARCHY[requiredRole] || 999;
    return userRoleLevel <= requiredRoleLevel; // Lower number = higher priority
  });
}

/**
 * Get user's allowed actions for a subject
 */
export async function getAllowedActions(user: User, subject: Subject): Promise<Action[]> {
  const actions: Action[] = ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import', 'sync', 'reset'];
  
  const allowedActions: Action[] = [];
  for (const action of actions) {
    if (await hasPermission(user, action, subject)) {
      allowedActions.push(action);
    }
  }
  
  return allowedActions;
}

/**
 * Check if user can access a specific route
 */
export async function canAccessRoute(user: User, route: string): Promise<boolean> {
  // Define base route permission mappings (can be extended dynamically)
  // All routes now use permission-based access instead of role restrictions
  const baseRoutePermissions: Record<string, { action: Action; subject: Subject; roles: UserRole[] }> = {
    '/dashboard': { action: 'read', subject: 'Settings', roles: [] },
    '/employee-dashboard': { action: 'read', subject: 'Employee', roles: [] },
    '/modules/employee-management': { action: 'read', subject: 'Employee', roles: [] },
    '/modules/customer-management': { action: 'read', subject: 'Customer', roles: [] },
    '/modules/equipment-management': { action: 'read', subject: 'Equipment', roles: [] },
    '/modules/maintenance-management': { action: 'read', subject: 'Maintenance', roles: [] },
    '/modules/company-management': { action: 'manage', subject: 'Company', roles: [] },
    '/modules/rental-management': { action: 'read', subject: 'Rental', roles: [] },
    '/modules/quotation-management': { action: 'read', subject: 'Quotation', roles: [] },
    '/modules/payroll-management': { action: 'read', subject: 'Payroll', roles: [] },
    '/modules/timesheet-management': { action: 'read', subject: 'Timesheet', roles: [] },
    '/modules/project-management': { action: 'read', subject: 'Project', roles: [] },
    '/modules/leave-management': { action: 'read', subject: 'Leave', roles: [] },
    '/modules/location-management': { action: 'read', subject: 'Settings', roles: [] },
    '/modules/user-management': { action: 'read', subject: 'User', roles: [] },
    '/modules/analytics': { action: 'read', subject: 'Report', roles: [] },
    '/modules/safety-management': { action: 'read', subject: 'Safety', roles: [] },
    '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: [] },
    '/modules/reporting': { action: 'read', subject: 'Report', roles: [] },
    '/modules/settings': { action: 'read', subject: 'Settings', roles: [] },
    '/modules/audit-compliance': { action: 'read', subject: 'Report', roles: [] },
    '/modules/document-management': { action: 'read', subject: 'Document', roles: [] },
    '/admin': { action: 'manage', subject: 'Settings', roles: [] },
    '/reports': { action: 'read', subject: 'Report', roles: [] },
  };

  // Get the route permission configuration
  const routePermission = baseRoutePermissions[route];
  if (!routePermission) return true; // Allow access if no specific permission defined

  // Check if user has required role using dynamic role hierarchy (only if roles are specified)
  if (routePermission.roles.length > 0 && !hasRequiredRole(user.role, routePermission.roles)) {
    return false;
  }

  // Check if user has required permission
  return await hasPermission(user, routePermission.action, routePermission.subject);
}

/**
 * Dynamic route permission management
 * These functions allow you to add/update route permissions for new roles
 */

// Store dynamic route permissions
const dynamicRoutePermissions = new Map<string, { action: Action; subject: Subject; roles: UserRole[] }>();

/**
 * Add or update route permission for a specific route
 * This allows new roles to access routes without code changes
 */
export function addRoutePermission(
  route: string, 
  action: Action, 
  subject: Subject, 
  roles: UserRole[]
): void {
  dynamicRoutePermissions.set(route, { action, subject, roles });
  console.log(`✅ Added route permission: ${route} for roles: ${roles.join(', ')}`);
}

/**
 * Remove route permission for a specific route
 */
export function removeRoutePermission(route: string): void {
  dynamicRoutePermissions.delete(route);
  console.log(`🗑️ Removed route permission: ${route}`);
}

/**
 * Get all dynamic route permissions
 */
export function getDynamicRoutePermissions(): Map<string, { action: Action; subject: Subject; roles: UserRole[] }> {
  return new Map(dynamicRoutePermissions);
}

/**
 * Enhanced route access checking that includes dynamic permissions
 */
export async function canAccessRouteEnhanced(user: User, route: string): Promise<boolean> {
  // First check dynamic route permissions (newer, takes precedence)
  const dynamicPermission = dynamicRoutePermissions.get(route);
  if (dynamicPermission) {
    // Check if user has required role
    if (!hasRequiredRole(user.role, dynamicPermission.roles)) {
      return false;
    }
    // Check if user has required permission
    return await hasPermission(user, dynamicPermission.action, dynamicPermission.subject);
  }

  // Fall back to base route permissions
  return await canAccessRoute(user, route);
}

/**
 * Automatically grant route access to new roles based on their permissions
 * This function analyzes a role's permissions and grants access to relevant routes
 */
export function autoGrantRouteAccess(roleName: string): void {
  const rolePermissions = DYNAMIC_FALLBACK_PERMISSIONS[roleName];
  if (!rolePermissions) {
    console.warn(`⚠️ Role ${roleName} not found, cannot auto-grant route access`);
    return;
  }

  const grantedRoutes: string[] = [];

  // Auto-grant access based on role permissions
  if (rolePermissions.includes('read.employee-data') || rolePermissions.includes('manage.employee-data')) {
    addRoutePermission('/modules/employee-management', 'read', 'Employee', [roleName]);
    grantedRoutes.push('/modules/employee-management');
  }

  if (rolePermissions.includes('read.customer') || rolePermissions.includes('manage.customer')) {
    addRoutePermission('/modules/customer-management', 'read', 'Customer', [roleName]);
    grantedRoutes.push('/modules/customer-management');
  }

  if (rolePermissions.includes('read.equipment') || rolePermissions.includes('manage.equipment')) {
    addRoutePermission('/modules/equipment-management', 'read', 'Equipment', [roleName]);
    grantedRoutes.push('/modules/equipment-management');
  }

  if (rolePermissions.includes('read.project') || rolePermissions.includes('manage.project')) {
    addRoutePermission('/modules/project-management', 'read', 'Project', [roleName]);
    grantedRoutes.push('/modules/project-management');
  }

  if (rolePermissions.includes('read.timesheet') || rolePermissions.includes('manage.timesheet')) {
    addRoutePermission('/modules/timesheet-management', 'read', 'Timesheet', [roleName]);
    grantedRoutes.push('/modules/timesheet-management');
  }

  if (rolePermissions.includes('read.report') || rolePermissions.includes('export.report')) {
    addRoutePermission('/modules/analytics', 'read', 'Report', [roleName]);
    addRoutePermission('/modules/reporting', 'read', 'Report', [roleName]);
    addRoutePermission('/reports', 'read', 'Report', [roleName]);
    grantedRoutes.push('/modules/analytics', '/modules/reporting', '/reports');
  }

  if (rolePermissions.includes('read.settings') || rolePermissions.includes('read.system-setting')) {
    addRoutePermission('/modules/settings', 'read', 'Settings', [roleName]);
    grantedRoutes.push('/modules/settings');
  }

  if (rolePermissions.includes('read.quotation') || rolePermissions.includes('manage.quotation')) {
    addRoutePermission('/modules/quotation-management', 'read', 'Quotation', [roleName]);
    grantedRoutes.push('/modules/quotation-management');
  }

  if (rolePermissions.includes('read.leave') || rolePermissions.includes('manage.leave')) {
    addRoutePermission('/modules/leave-management', 'read', 'Leave', [roleName]);
    grantedRoutes.push('/modules/leave-management');
  }

  if (rolePermissions.includes('read.payroll') || rolePermissions.includes('manage.payroll')) {
    addRoutePermission('/modules/payroll-management', 'read', 'Payroll', [roleName]);
    grantedRoutes.push('/modules/payroll-management');
  }

  if (rolePermissions.includes('read.salaryincrement')) {
    addRoutePermission('/modules/salary-increments', 'read', 'SalaryIncrement', [roleName]);
    grantedRoutes.push('/modules/salary-increments');
  }

  if (rolePermissions.includes('read.safety') || rolePermissions.includes('manage.safety')) {
    addRoutePermission('/modules/safety-management', 'read', 'Safety', [roleName]);
    grantedRoutes.push('/modules/safety-management');
  }

  // Grant dashboard access to most roles
  if (rolePermissions.length > 0) {
    addRoutePermission('/dashboard', 'read', 'Settings', [roleName]);
    grantedRoutes.push('/dashboard');
  }

  console.log(`✅ Auto-granted route access for role ${roleName}:`, grantedRoutes);
}

/**
 * Enhanced addNewRole function that automatically grants route access
 */
export function addNewRoleWithRouteAccess(roleName: string, priority: number, permissions: string[]): void {
  // Add the role to the system
  addNewRole(roleName, priority, permissions);
  
  // Automatically grant route access based on permissions
  autoGrantRouteAccess(roleName);
  
  console.log(`✅ Added new role ${roleName} with automatic route access`);
}

/**
 * Add a new role to the system dynamically
 * This function allows you to add new roles without code changes
 */
export function addNewRole(roleName: string, priority: number, permissions: string[]): void {
  // Add to role hierarchy
  DYNAMIC_ROLE_HIERARCHY[roleName] = priority;
  
  // Add to fallback permissions
  DYNAMIC_FALLBACK_PERMISSIONS[roleName] = permissions;
  
  console.log(`✅ Added new role: ${roleName} with priority ${priority} and ${permissions.length} permissions`);
}

/**
 * Remove a role from the system dynamically
 */
export function removeRole(roleName: string): void {
  delete DYNAMIC_ROLE_HIERARCHY[roleName];
  delete DYNAMIC_FALLBACK_PERMISSIONS[roleName];
  
  console.log(`🗑️ Removed role: ${roleName}`);
}

/**
 * Update role permissions dynamically
 */
export function updateRolePermissions(roleName: string, permissions: string[]): void {
  if (DYNAMIC_FALLBACK_PERMISSIONS[roleName]) {
    DYNAMIC_FALLBACK_PERMISSIONS[roleName] = permissions;
    console.log(`✅ Updated permissions for role: ${roleName}`);
  } else {
    console.warn(`⚠️ Role ${roleName} not found, cannot update permissions`);
  }
}

/**
 * Get all available roles
 */
export function getAllRoles(): string[] {
  return Object.keys(DYNAMIC_ROLE_HIERARCHY);
}

/**
 * Get role priority
 */
export function getRolePriority(roleName: string): number {
  return DYNAMIC_ROLE_HIERARCHY[roleName] || 999;
}
