// Custom RBAC System - Replaces CASL
// Simple, direct role-based access control using NextAuth session

export type UserRole = string; // Dynamic - will be loaded from database

export type Action =
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
  | 'reset';

export type Subject =
  | 'User'
  | 'Employee'
  | 'Customer'
  | 'Equipment'
  | 'Maintenance'
  | 'Rental'
  | 'Quotation'
  | 'Payroll'
  | 'Timesheet'
  | 'Project'
  | 'Leave'
  | 'Department'
  | 'Designation'
  | 'Report'
  | 'Settings'
  | 'Company'
  | 'Location'
  | 'Advance'
  | 'Assignment'
  | 'Safety'
  | 'employee-document'
  | 'SalaryIncrement'
  | 'Role'
  | 'Permission'
  | 'employee-leave'
  | 'employee-salary'
  | 'employee-skill'
  | 'employee-training'
  | 'employee-performance'
  | 'employee-resignation'
  | 'customer-document'
  | 'customer-project'
  | 'equipment-rental'
  | 'equipment-maintenance'
  | 'equipment-history'
  | 'maintenance-item'
  | 'maintenance-schedule'
  | 'rental-item'
  | 'rental-history'
  | 'rental-contract'
  | 'quotation-term'
  | 'quotation-item'
  | 'payroll-item'
  | 'payroll-run'
  | 'tax-document'
  | 'time-entry'
  | 'weekly-timesheet'
  | 'timesheet-approval'
  | 'project-task'
  | 'project-milestone'
  | 'project-template'
  | 'project-risk'
  | 'project-manpower'
  | 'project-equipment'
  | 'project-material'
  | 'project-fuel'
  | 'project-expense'
  | 'project-subcontractor'
  | 'time-off-request'
  | 'organizational-unit'
  | 'Skill'
  | 'Training'
  | 'company-document'
  | 'company-document-type'
  | 'system-setting'
  | 'country'
  | 'report-template'
  | 'scheduled-report'
  | 'analytics-report'
  | 'safety-incident'
  | 'safety-report'
  | 'advance-payment'
  | 'loan'
  | 'advance-history'
  | 'Analytics'
  | 'Dashboard'
  | 'Notification'
  | 'geofence-zone'
  | 'Document'
  | 'document-version'
  | 'document-approval'
  | 'resource-allocation'
  | 'performance-review'
  | 'performance-goal'
  | 'file'
  | 'image'
  | 'video'
  | 'audio'
  | 'webhook'
  | 'integration'
  | 'external-system'
  | 'cron-job'
  | 'scheduled-task'
  | 'translation'
  | 'language'
  | 'own-profile'
  | 'own-preferences'
  | 'own-timesheet'
  | 'own-leave'
  | 'employee-dashboard'
  | 'employee-data'
  | 'bulk'
  | 'mass'
  | 'override'
  | 'bypass'
  | 'emergency'
  | 'audit'
  | 'compliance'
  | 'gdpr'
  | 'backup'
  | 'recovery'
  | 'all';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  department?: string;
  permissions?: string[];
}

// Dynamic role hierarchy - will be loaded from database
// For now, use a simple mapping that can be extended
const getRolePriority = (role: string): number => {
  const priorityMap: Record<string, number> = {
    'SUPER_ADMIN': 1,
    'ADMIN': 2,
    'MANAGER': 3,
    'SUPERVISOR': 4,
    'OPERATOR': 5,
    'EMPLOYEE': 6,
    'USER': 7,
  };
  return priorityMap[role] || 10; // Default priority for new roles
};

// Define permissions for each role
const rolePermissions: Record<
  UserRole,
  {
    can: Array<{ action: Action; subject: Subject }>;
    cannot?: Array<{ action: Action; subject: Subject }>;
  }
> = {
  SUPER_ADMIN: {
    can: [
      // Full access to everything
      { action: 'manage', subject: 'all' },
    ],
  },
  ADMIN: {
    can: [
      // User management
      { action: 'manage', subject: 'User' },
      { action: 'manage', subject: 'Employee' },
      { action: 'manage', subject: 'Customer' },
      { action: 'manage', subject: 'Equipment' },
      { action: 'manage', subject: 'Rental' },
      { action: 'manage', subject: 'Quotation' },
      { action: 'manage', subject: 'Payroll' },
      { action: 'manage', subject: 'Timesheet' },
      { action: 'manage', subject: 'Project' },
      { action: 'manage', subject: 'Leave' },
      { action: 'manage', subject: 'Department' },
      { action: 'manage', subject: 'Designation' },
      { action: 'manage', subject: 'Report' },
      { action: 'manage', subject: 'Settings' },
      { action: 'manage', subject: 'Company' },
      { action: 'manage', subject: 'Safety' },
      { action: 'manage', subject: 'employee-document' },
      { action: 'manage', subject: 'SalaryIncrement' },
      { action: 'manage', subject: 'Advance' },
      { action: 'manage', subject: 'Assignment' },
      { action: 'manage', subject: 'Location' },
      { action: 'manage', subject: 'Maintenance' },
    ],
  },
  MANAGER: {
    can: [
      // Employee management
      { action: 'read', subject: 'User' },
      { action: 'manage', subject: 'Employee' },
      { action: 'manage', subject: 'Customer' },
      { action: 'manage', subject: 'Equipment' },
      { action: 'manage', subject: 'Rental' },
      { action: 'manage', subject: 'Quotation' },
      { action: 'read', subject: 'Payroll' },
      { action: 'manage', subject: 'Timesheet' },
      { action: 'manage', subject: 'Project' },
      { action: 'manage', subject: 'Leave' },
      { action: 'read', subject: 'Department' },
      { action: 'read', subject: 'Designation' },
      { action: 'read', subject: 'Report' },
      { action: 'read', subject: 'Settings' },
      { action: 'read', subject: 'Company' },
      { action: 'read', subject: 'Safety' },
      { action: 'manage', subject: 'employee-document' },
      { action: 'manage', subject: 'SalaryIncrement' },
      { action: 'manage', subject: 'Advance' },
      { action: 'manage', subject: 'Assignment' },
      { action: 'read', subject: 'Location' },
      { action: 'read', subject: 'Maintenance' },
    ],
  },
  SUPERVISOR: {
    can: [
      // Department-level access
      { action: 'read', subject: 'User' },
      { action: 'manage', subject: 'Employee' },
      { action: 'read', subject: 'Customer' },
      { action: 'read', subject: 'Equipment' },
      { action: 'read', subject: 'Rental' },
      { action: 'manage', subject: 'Quotation' },
      { action: 'read', subject: 'Payroll' },
      { action: 'manage', subject: 'Timesheet' },
      { action: 'manage', subject: 'Project' },
      { action: 'manage', subject: 'Leave' },
      { action: 'read', subject: 'Department' },
      { action: 'read', subject: 'Designation' },
      { action: 'read', subject: 'Report' },
      { action: 'read', subject: 'Settings' },
      { action: 'read', subject: 'Company' },
      { action: 'read', subject: 'Safety' },
      { action: 'manage', subject: 'employee-document' },
      { action: 'read', subject: 'SalaryIncrement' },
      { action: 'read', subject: 'Advance' },
      { action: 'read', subject: 'Assignment' },
      { action: 'read', subject: 'Location' },
      { action: 'read', subject: 'Maintenance' },
    ],
  },
  OPERATOR: {
    can: [
      // Operational access
      { action: 'read', subject: 'User' },
      { action: 'read', subject: 'Employee' },
      { action: 'read', subject: 'Customer' },
      { action: 'read', subject: 'Equipment' },
      { action: 'read', subject: 'Rental' },
      { action: 'read', subject: 'Quotation' },
      { action: 'read', subject: 'Payroll' },
      { action: 'read', subject: 'Timesheet' },
      { action: 'read', subject: 'Project' },
      { action: 'read', subject: 'Leave' },
      { action: 'read', subject: 'Department' },
      { action: 'read', subject: 'Designation' },
      { action: 'read', subject: 'Report' },
      { action: 'read', subject: 'Settings' },
      { action: 'read', subject: 'Company' },
      { action: 'read', subject: 'Safety' },
      { action: 'read', subject: 'employee-document' },
      { action: 'read', subject: 'SalaryIncrement' },
      { action: 'read', subject: 'Advance' },
      { action: 'read', subject: 'Assignment' },
      { action: 'read', subject: 'Location' },
      { action: 'read', subject: 'Maintenance' },
    ],
  },
  EMPLOYEE: {
    can: [
      // Basic access
      { action: 'read', subject: 'User' },
      { action: 'read', subject: 'Employee' },
      { action: 'read', subject: 'Customer' },
      { action: 'read', subject: 'Equipment' },
      { action: 'read', subject: 'Rental' },
      { action: 'read', subject: 'Quotation' },
      { action: 'read', subject: 'Payroll' },
      { action: 'manage', subject: 'Timesheet' },
      { action: 'read', subject: 'Project' },
      { action: 'manage', subject: 'Leave' },
      { action: 'read', subject: 'Department' },
      { action: 'read', subject: 'Designation' },
      { action: 'read', subject: 'Report' },
      { action: 'read', subject: 'Settings' },
      { action: 'read', subject: 'Company' },
      { action: 'manage', subject: 'employee-document' },
      { action: 'read', subject: 'SalaryIncrement' },
    ],
  },
  USER: {
    can: [
      // Minimal access
      { action: 'read', subject: 'User' },
      { action: 'read', subject: 'Employee' },
      { action: 'read', subject: 'Customer' },
      { action: 'read', subject: 'Equipment' },
      { action: 'read', subject: 'Rental' },
      { action: 'read', subject: 'Quotation' },
      { action: 'read', subject: 'Timesheet' },
      { action: 'read', subject: 'Project' },
      { action: 'read', subject: 'Leave' },
      { action: 'read', subject: 'Department' },
      { action: 'read', subject: 'Settings' },
      { action: 'read', subject: 'Report' },
      { action: 'read', subject: 'Settings' },
      { action: 'read', subject: 'Company' },
      { action: 'read', subject: 'employee-document' },
      { action: 'read', subject: 'SalaryIncrement' },
    ],
  },
  PROJECT_LEADER: {
    can: [
      // Project management focus
      { action: 'manage', subject: 'Project' },
      { action: 'manage', subject: 'Project' },
      { action: 'manage', subject: 'project-task' },
      { action: 'manage', subject: 'project-milestone' },
      { action: 'read', subject: 'Employee' },
      { action: 'read', subject: 'Timesheet' },
      { action: 'read', subject: 'Report' },
    ],
  },
  FINANCE_SPECIALIST: {
    can: [
      // Financial operations focus
      { action: 'read', subject: 'Payroll' },
      { action: 'read', subject: 'SalaryIncrement' },
      { action: 'read', subject: 'Advance' },
      { action: 'read', subject: 'Report' },
      { action: 'read', subject: 'Employee' },
      { action: 'export', subject: 'Report' },
    ],
  },
  HR_SPECIALIST: {
    can: [
      // Human resources focus
      { action: 'read', subject: 'Employee' },
      { action: 'read', subject: 'Leave' },
      { action: 'read', subject: 'performance-review' },
      { action: 'read', subject: 'Training' },
      { action: 'read', subject: 'Report' },
      { action: 'read', subject: 'User' },
    ],
  },
  SALES_REPRESENTATIVE: {
    can: [
      // Sales operations focus
      { action: 'read', subject: 'Customer' },
      { action: 'manage', subject: 'Quotation' },
      { action: 'read', subject: 'Project' },
      { action: 'read', subject: 'Report' },
      { action: 'export', subject: 'Report' },
    ],
  },
};

// Route permissions mapping
export const routePermissions: Record<
  string,
  { action: Action; subject: Subject; roles: UserRole[] }
> = {
  '/dashboard': { 
    action: 'read',
    subject: 'Settings',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'],
  },
  '/employee-dashboard': { action: 'read', subject: 'Employee', roles: ['EMPLOYEE'] },
  '/modules/employee-management': {
    action: 'read',
    subject: 'Employee',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'],
  },
  '/modules/customer-management': {
    action: 'read',
    subject: 'Customer',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'],
  },
  '/modules/equipment-management': {
    action: 'read',
    subject: 'Equipment',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'],
  },
  '/modules/maintenance-management': {
    action: 'read',
    subject: 'Maintenance',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  '/modules/company-management': {
    action: 'manage',
    subject: 'Company',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  '/modules/rental-management': {
    action: 'read',
    subject: 'Rental',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'],
  },
  '/modules/quotation-management': {
    action: 'read',
    subject: 'Quotation',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'],
  },
  '/modules/payroll-management': {
    action: 'read',
    subject: 'Payroll',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  '/modules/timesheet-management': {
    action: 'read',
    subject: 'Timesheet',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'],
  },
  '/modules/project-management': {
    action: 'read',
    subject: 'Project',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'],
  },
  '/modules/leave-management': {
    action: 'read',
    subject: 'Leave',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'],
  },
  '/modules/location-management': {
    action: 'read',
    subject: 'Settings',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  '/modules/user-management': { action: 'read', subject: 'User', roles: ['SUPER_ADMIN', 'ADMIN'] },
  '/modules/analytics': {
    action: 'read',
    subject: 'Report',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  '/modules/safety-management': {
    action: 'read',
    subject: 'Safety',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  '/modules/salary-increments': {
    action: 'read',
    subject: 'SalaryIncrement',
    roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'USER'],
  },
  '/modules/reporting': {
    action: 'read',
    subject: 'Report',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  '/modules/settings': {
    action: 'read',
    subject: 'Settings',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'],
  },
  '/modules/audit-compliance': {
    action: 'read',
    subject: 'Report',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  '/admin': { action: 'manage', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
  '/reports': {
    action: 'read',
    subject: 'Report',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
};

// Helper function to check if user has required role or higher
export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const userRoleLevel = getRolePriority(userRole);

  return requiredRoles.some(requiredRole => {
    const requiredRoleLevel = getRolePriority(requiredRole);
    return userRoleLevel <= requiredRoleLevel; // Lower number = higher priority
  });
}

// Helper function to check if user has permission
export function hasPermission(user: User, action: Action, subject: Subject): boolean {
  if (!user || !user.isActive) return false;

  const role = (user.role?.toUpperCase() as UserRole) || 'USER';
  const permissions = rolePermissions[role];

  if (!permissions) return false;

  // Check if user has the specific permission
  const hasCanPermission = permissions.can.some(
    permission =>
      (permission.action === action || permission.action === 'manage') &&
      (permission.subject === subject || permission.subject === 'all')
  );

  if (!hasCanPermission) return false;

  // Check if there are any restrictions
  if (permissions.cannot) {
    const hasCannotPermission = permissions.cannot.some(
      permission => permission.action === action && permission.subject === subject
    );
    if (hasCannotPermission) return false;
  }

  return true;
}

// Helper function to get user's allowed actions for a subject
export function getAllowedActions(user: User, subject: Subject): Action[] {
  if (!user || !user.isActive) return [];

  const role = (user.role?.toUpperCase() as UserRole) || 'USER';
  const permissions = rolePermissions[role];

  if (!permissions) return [];

  const actions: Action[] = [
    'create',
    'read',
    'update',
    'delete',
    'approve',
    'reject',
    'export',
    'import',
    'sync',
    'reset',
  ];

  return actions.filter(action => hasPermission(user, action, subject));
}

// Helper function to check if user can access a specific route
export function canAccessRoute(user: User, route: string): boolean {
  const routePermission = routePermissions[route];
  if (!routePermission) return true; // Allow access if no specific permission defined

  return (
    hasRequiredRole(user.role, routePermission.roles) &&
    hasPermission(user, routePermission.action, routePermission.subject)
  );
}

// Helper function to get user's role permissions
export function getRolePermissions(role: UserRole): typeof rolePermissions[UserRole] | undefined {
  return rolePermissions[role] || rolePermissions.USER;
}

// Helper function to create a user object from session
export function createUserFromSession(session: { user?: { id?: string; email?: string; name?: string; role?: string; isActive?: boolean } }): User | null {
  if (!session?.user) return null;

  let role = (session.user.role || 'USER').toUpperCase() as UserRole;

  // ALWAYS ensure these emails have SUPER_ADMIN role
  if (session.user.email === 'admin@ias.com' || session.user.email === 'ias.snd2024@gmail.com') {
    role = 'SUPER_ADMIN';
  }

  return {
    id: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || '',
    role: role,
    isActive: session.user.isActive || true,
  };
}
