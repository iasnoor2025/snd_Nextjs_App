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
  | 'Leave'
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

// Map database permissions to CASL actions and subjects
const permissionMapping: Record<string, { action: Actions; subject: Subjects }> = {
  'users.read': { action: 'read', subject: 'User' },
  'users.create': { action: 'create', subject: 'User' },
  'users.update': { action: 'update', subject: 'User' },
  'users.delete': { action: 'delete', subject: 'User' },
  
  'employees.read': { action: 'read', subject: 'Employee' },
  'employees.create': { action: 'create', subject: 'Employee' },
  'employees.update': { action: 'update', subject: 'Employee' },
  'employees.delete': { action: 'delete', subject: 'Employee' },
  'employees.approve': { action: 'approve', subject: 'Employee' },
  'employees.reject': { action: 'reject', subject: 'Employee' },
  
  'customers.read': { action: 'read', subject: 'Customer' },
  'customers.create': { action: 'create', subject: 'Customer' },
  'customers.update': { action: 'update', subject: 'Customer' },
  'customers.delete': { action: 'delete', subject: 'Customer' },
  'customers.approve': { action: 'approve', subject: 'Customer' },
  'customers.reject': { action: 'reject', subject: 'Customer' },
  
  'equipment.read': { action: 'read', subject: 'Equipment' },
  'equipment.create': { action: 'create', subject: 'Equipment' },
  'equipment.update': { action: 'update', subject: 'Equipment' },
  'equipment.delete': { action: 'delete', subject: 'Equipment' },
  'equipment.approve': { action: 'approve', subject: 'Equipment' },
  'equipment.reject': { action: 'reject', subject: 'Equipment' },
  
  'rentals.read': { action: 'read', subject: 'Rental' },
  'rentals.create': { action: 'create', subject: 'Rental' },
  'rentals.update': { action: 'update', subject: 'Rental' },
  'rentals.delete': { action: 'delete', subject: 'Rental' },
  'rentals.approve': { action: 'approve', subject: 'Rental' },
  'rentals.reject': { action: 'reject', subject: 'Rental' },
  
  'payroll.read': { action: 'read', subject: 'Payroll' },
  'payroll.create': { action: 'create', subject: 'Payroll' },
  'payroll.update': { action: 'update', subject: 'Payroll' },
  'payroll.delete': { action: 'delete', subject: 'Payroll' },
  'payroll.approve': { action: 'approve', subject: 'Payroll' },
  'payroll.reject': { action: 'reject', subject: 'Payroll' },
  'payroll.export': { action: 'export', subject: 'Payroll' },
  
  'timesheets.read': { action: 'read', subject: 'Timesheet' },
  'timesheets.create': { action: 'create', subject: 'Timesheet' },
  'timesheets.update': { action: 'update', subject: 'Timesheet' },
  'timesheets.delete': { action: 'delete', subject: 'Timesheet' },
  'timesheets.approve': { action: 'approve', subject: 'Timesheet' },
  'timesheets.reject': { action: 'reject', subject: 'Timesheet' },
  
  'projects.read': { action: 'read', subject: 'Project' },
  'projects.create': { action: 'create', subject: 'Project' },
  'projects.update': { action: 'update', subject: 'Project' },
  'projects.delete': { action: 'delete', subject: 'Project' },
  'projects.approve': { action: 'approve', subject: 'Project' },
  'projects.reject': { action: 'reject', subject: 'Project' },
  
  'leaves.read': { action: 'read', subject: 'Leave' },
  'leaves.create': { action: 'create', subject: 'Leave' },
  'leaves.update': { action: 'update', subject: 'Leave' },
  'leaves.delete': { action: 'delete', subject: 'Leave' },
  'leaves.approve': { action: 'approve', subject: 'Leave' },
  'leaves.reject': { action: 'reject', subject: 'Leave' },
  
  'reports.read': { action: 'read', subject: 'Report' },
  'reports.create': { action: 'create', subject: 'Report' },
  'reports.update': { action: 'update', subject: 'Report' },
  'reports.delete': { action: 'delete', subject: 'Report' },
  'reports.export': { action: 'export', subject: 'Report' },
  'reports.approve': { action: 'approve', subject: 'Report' },
  'reports.reject': { action: 'reject', subject: 'Report' },
  
  'settings.read': { action: 'read', subject: 'Settings' },
  'settings.update': { action: 'update', subject: 'Settings' },
  
  'analytics.read': { action: 'read', subject: 'Report' },
  'analytics.approve': { action: 'approve', subject: 'Report' },
  'analytics.reject': { action: 'reject', subject: 'Report' },
  
  'system.sync': { action: 'sync', subject: 'all' },
  'system.reset': { action: 'reset', subject: 'all' },
  'system.approve': { action: 'approve', subject: 'all' },
  'system.reject': { action: 'reject', subject: 'all' },
  
  // Global approval permissions
  'approve.all': { action: 'approve', subject: 'all' },
  'reject.all': { action: 'reject', subject: 'all' },
};

// Define permissions for each role (fallback if database permissions are not available)
const rolePermissions = {
  SUPER_ADMIN: {
    can: [
      // Complete system access - all actions on all subjects
      { action: 'manage', subject: 'all' },
      
      // Specific approval permissions for all modules
      { action: 'approve', subject: 'Rental' },
      { action: 'reject', subject: 'Rental' },
      { action: 'approve', subject: 'Payroll' },
      { action: 'reject', subject: 'Payroll' },
      { action: 'approve', subject: 'Timesheet' },
      { action: 'reject', subject: 'Timesheet' },
      { action: 'approve', subject: 'Leave' },
      { action: 'reject', subject: 'Leave' },
      { action: 'approve', subject: 'Project' },
      { action: 'reject', subject: 'Project' },
      { action: 'approve', subject: 'Equipment' },
      { action: 'reject', subject: 'Equipment' },
      { action: 'approve', subject: 'Employee' },
      { action: 'reject', subject: 'Employee' },
      { action: 'approve', subject: 'Customer' },
      { action: 'reject', subject: 'Customer' },
      
      // Export and import permissions
      { action: 'export', subject: 'all' },
      { action: 'import', subject: 'all' },
      
      // System operations
      { action: 'sync', subject: 'all' },
      { action: 'reset', subject: 'all' },
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

      // Settings
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
  EMPLOYEE: {
    can: [
      // Employee can manage their own data
      { action: 'read', subject: 'Employee' },
      { action: 'update', subject: 'Employee' },
      
      // Basic customer and equipment access
      { action: 'read', subject: 'Customer' },
      { action: 'read', subject: 'Equipment' },
      
      // Rental access for their own rentals
      { action: 'read', subject: 'Rental' },
      { action: 'create', subject: 'Rental' },
      { action: 'update', subject: 'Rental' },
      
      // Timesheet management for their own timesheets
      { action: 'read', subject: 'Timesheet' },
      { action: 'create', subject: 'Timesheet' },
      { action: 'update', subject: 'Timesheet' },
      
      // Project access
      { action: 'read', subject: 'Project' },
      
      // Leave management for their own leaves
      { action: 'read', subject: 'Leave' },
      { action: 'create', subject: 'Leave' },
      { action: 'update', subject: 'Leave' },
    ],
  },
};

// Create ability for a user
export function createAbilityFor(user: User): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  // Get user's role permissions
  const role = user.role?.toUpperCase() || 'USER';
  
  // PERMANENT FIX: Force correct role based on email
  if (user.email === 'admin@ias.com') {
  
    const superAdminPermissions = rolePermissions.SUPER_ADMIN;
    superAdminPermissions.can.forEach((permission: any) => {
      can(permission.action, permission.subject);
    });
  } else {
    const permissions = rolePermissions[role as keyof typeof rolePermissions] || rolePermissions.USER;

    // Apply role permissions
    permissions.can.forEach((permission: any) => {
      can(permission.action, permission.subject);
    });

    // Apply any restrictions if they exist
    if ('cannot' in permissions && Array.isArray(permissions.cannot)) {
      permissions.cannot.forEach((permission: any) => {
        cannot(permission.action, permission.subject);
      });
    }
  }

  // Special cases for specific roles (simplified without conditions)
  if (role === 'OPERATOR') {
    // Operators can manage their own data
    can('update', 'Employee');
    can('manage', 'Timesheet');
  }

  if (role === 'SUPERVISOR') {
    // Supervisors can manage department data
    can('manage', 'Employee');
    can('manage', 'Timesheet');
  }

  return build({
    detectSubjectType: () => 'all' as ExtractSubjectType<Subjects>,
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
