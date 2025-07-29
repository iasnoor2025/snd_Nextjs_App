import { AbilityBuilder, Ability, AbilityClass, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { createMongoAbility } from '@casl/ability';

// Define subject types
export type Subjects =
  | 'User'
  | 'Employee'
  | 'Customer'
  | 'Equipment'
  | 'Rental'
  | 'Payroll'
  | 'Timesheet'
  | 'Project'
  | 'Department'
  | 'Designation'
  | 'Report'
  | 'Settings'
  | 'all';

// Define actions
export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'sync'
  | 'reset'
  | 'all';

// Define user interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  department?: string;
  permissions?: string[];
}

// Create ability type
export type AppAbility = Ability<[Actions, Subjects]>;
export const AppAbility = Ability as AbilityClass<AppAbility>;

// Define permissions for each role
const rolePermissions = {
  SUPER_ADMIN: {
    can: [
      { action: 'manage', subject: 'all' },
    ],
  },
  ADMIN: {
    can: [
      // User management
      { action: 'manage', subject: 'User' },

      // Employee management
      { action: 'manage', subject: 'Employee' },
      { action: 'manage', subject: 'Department' },
      { action: 'manage', subject: 'Designation' },

      // Customer management
      { action: 'manage', subject: 'Customer' },

      // Equipment management
      { action: 'manage', subject: 'Equipment' },

      // Rental management
      { action: 'manage', subject: 'Rental' },
      { action: 'approve', subject: 'Rental' },
      { action: 'reject', subject: 'Rental' },

      // Payroll management
      { action: 'manage', subject: 'Payroll' },
      { action: 'approve', subject: 'Payroll' },
      { action: 'export', subject: 'Payroll' },

      // Timesheet management
      { action: 'manage', subject: 'Timesheet' },
      { action: 'approve', subject: 'Timesheet' },
      { action: 'reject', subject: 'Timesheet' },

      // Project management
      { action: 'manage', subject: 'Project' },

      // Reports
      { action: 'read', subject: 'Report' },
      { action: 'export', subject: 'Report' },

      // Settings
      { action: 'manage', subject: 'Settings' },

      // System operations
      { action: 'sync', subject: 'Employee' },
      { action: 'reset', subject: 'all' },
    ],
  },
  MANAGER: {
    can: [
      // Employee management (limited)
      { action: 'read', subject: 'Employee' },
      { action: 'update', subject: 'Employee' },
      { action: 'read', subject: 'Department' },
      { action: 'read', subject: 'Designation' },

      // Customer management
      { action: 'manage', subject: 'Customer' },

      // Equipment management
      { action: 'read', subject: 'Equipment' },
      { action: 'update', subject: 'Equipment' },

      // Rental management
      { action: 'read', subject: 'Rental' },
      { action: 'create', subject: 'Rental' },
      { action: 'update', subject: 'Rental' },
      { action: 'approve', subject: 'Rental' },

      // Payroll management (limited)
      { action: 'read', subject: 'Payroll' },
      { action: 'approve', subject: 'Payroll' },

      // Timesheet management
      { action: 'read', subject: 'Timesheet' },
      { action: 'approve', subject: 'Timesheet' },
      { action: 'reject', subject: 'Timesheet' },

      // Project management
      { action: 'manage', subject: 'Project' },

      // Reports
      { action: 'read', subject: 'Report' },
      { action: 'export', subject: 'Report' },

      // Settings (read only)
      { action: 'read', subject: 'Settings' },
    ],
  },
  SUPERVISOR: {
    can: [
      // Employee management (very limited)
      { action: 'read', subject: 'Employee' },
      { action: 'read', subject: 'Department' },

      // Customer management
      { action: 'read', subject: 'Customer' },
      { action: 'create', subject: 'Customer' },
      { action: 'update', subject: 'Customer' },

      // Equipment management
      { action: 'read', subject: 'Equipment' },

      // Rental management
      { action: 'read', subject: 'Rental' },
      { action: 'create', subject: 'Rental' },
      { action: 'update', subject: 'Rental' },

      // Payroll management (very limited)
      { action: 'read', subject: 'Payroll' },

      // Timesheet management
      { action: 'read', subject: 'Timesheet' },
      { action: 'approve', subject: 'Timesheet' },
      { action: 'reject', subject: 'Timesheet' },

      // Project management
      { action: 'read', subject: 'Project' },
      { action: 'create', subject: 'Project' },
      { action: 'update', subject: 'Project' },

      // Reports (limited)
      { action: 'read', subject: 'Report' },
    ],
  },
  OPERATOR: {
    can: [
      // Employee management (own data only)
      { action: 'read', subject: 'Employee' },
      { action: 'update', subject: 'Employee' },

      // Customer management
      { action: 'read', subject: 'Customer' },

      // Equipment management
      { action: 'read', subject: 'Equipment' },

      // Rental management
      { action: 'read', subject: 'Rental' },
      { action: 'create', subject: 'Rental' },
      { action: 'update', subject: 'Rental' },

      // Timesheet management (own data)
      { action: 'read', subject: 'Timesheet' },
      { action: 'create', subject: 'Timesheet' },
      { action: 'update', subject: 'Timesheet' },

      // Project management
      { action: 'read', subject: 'Project' },
    ],
  },
  USER: {
    can: [
      // Basic read access
      { action: 'read', subject: 'Employee' },
      { action: 'read', subject: 'Customer' },
      { action: 'read', subject: 'Equipment' },
      { action: 'read', subject: 'Rental' },
      { action: 'read', subject: 'Project' },
    ],
  },
};

// Create ability for a user
export function createAbilityFor(user: User): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // Get user's role permissions
  const role = user.role?.toUpperCase() || 'USER';
  const permissions = rolePermissions[role as keyof typeof rolePermissions] || rolePermissions.USER;

  // Apply role permissions
  permissions.can.forEach((permission: any) => {
    can(permission.action, permission.subject);
  });

  // Apply any restrictions
  permissions.cannot?.forEach((permission: any) => {
    cannot(permission.action, permission.subject);
  });

  // Special cases for specific roles
  if (role === 'OPERATOR') {
    // Operators can only manage their own data
    can('update', 'Employee', { id: user.id });
    can('manage', 'Timesheet', { employeeId: user.id });
  }

  if (role === 'SUPERVISOR') {
    // Supervisors can manage their department's data
    can('manage', 'Employee', { department: user.department });
    can('manage', 'Timesheet', { department: user.department });
  }

  return build({
    detectSubjectType: (item) =>
      item.constructor as ExtractSubjectType<Subjects>,
  });
}

// Helper function to check if user has permission
export function hasPermission(user: User, action: Actions, subject: Subjects): boolean {
  const ability = createAbilityFor(user);
  return ability.can(action, subject);
}

// Helper function to get user's allowed actions for a subject
export function getAllowedActions(user: User, subject: Subjects): Actions[] {
  const ability = createAbilityFor(user);
  const actions: Actions[] = ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import', 'sync', 'reset'];

  return actions.filter(action => ability.can(action, subject));
}

// Helper function to get user's role permissions
export function getRolePermissions(role: string): any {
  const roleKey = role?.toUpperCase() || 'USER';
  return rolePermissions[roleKey as keyof typeof rolePermissions] || rolePermissions.USER;
}

// Helper function to check if user can access a specific route
export function canAccessRoute(user: User, route: string): boolean {
  const routePermissions: Record<string, { action: Actions; subject: Subjects }> = {
    '/modules/employee-management': { action: 'read', subject: 'Employee' },
    '/modules/customer-management': { action: 'read', subject: 'Customer' },
    '/modules/equipment-management': { action: 'read', subject: 'Equipment' },
    '/modules/rental-management': { action: 'read', subject: 'Rental' },
    '/modules/payroll-management': { action: 'read', subject: 'Payroll' },
    '/modules/timesheet-management': { action: 'read', subject: 'Timesheet' },
    '/modules/project-management': { action: 'read', subject: 'Project' },
    '/admin': { action: 'manage', subject: 'Settings' },
    '/reports': { action: 'read', subject: 'Report' },
  };

  const permission = routePermissions[route];
  if (!permission) return true; // Allow access if no specific permission defined

  return hasPermission(user, permission.action, permission.subject);
}
