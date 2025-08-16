// Custom RBAC System - Replaces CASL
// Simple, direct role-based access control using NextAuth session

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'EMPLOYEE' | 'USER';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import' | 'sync' | 'reset';

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

// Role hierarchy (lower number = higher priority)
const roleHierarchy: Record<UserRole, number> = {
  'SUPER_ADMIN': 1,
  'ADMIN': 2,
  'MANAGER': 3,
  'SUPERVISOR': 4,
  'OPERATOR': 5,
  'EMPLOYEE': 6,
  'USER': 7,
};

// Define permissions for each role
const rolePermissions: Record<UserRole, { can: Array<{ action: Action; subject: Subject }>; cannot?: Array<{ action: Action; subject: Subject }> }> = {
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
    ],
  },
  OPERATOR: {
    can: [
      // Operational access
      { action: 'read', subject: 'User' },
      { action: 'read', subject: 'Employee' },
      { action: 'manage', subject: 'Customer' },
      { action: 'manage', subject: 'Equipment' },
      { action: 'manage', subject: 'Rental' },
      { action: 'manage', subject: 'Quotation' },
      { action: 'read', subject: 'Payroll' },
      { action: 'manage', subject: 'Timesheet' },
      { action: 'manage', subject: 'Project' },
      { action: 'read', subject: 'Leave' },
      { action: 'read', subject: 'Department' },
      { action: 'read', subject: 'Designation' },
      { action: 'read', subject: 'Report' },
      { action: 'read', subject: 'Settings' },
      { action: 'read', subject: 'Company' },
      { action: 'read', subject: 'Safety' },
      { action: 'manage', subject: 'employee-document' },
      { action: 'read', subject: 'SalaryIncrement' },
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
      { action: 'read', subject: 'Designation' },
      { action: 'read', subject: 'Report' },
      { action: 'read', subject: 'Settings' },
      { action: 'read', subject: 'Company' },
      { action: 'read', subject: 'employee-document' },
      { action: 'read', subject: 'SalaryIncrement' },
    ],
  },
};

// Route permissions mapping
export const routePermissions: Record<string, { action: Action; subject: Subject; roles: UserRole[] }> = {
  '/dashboard': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'] },
  '/employee-dashboard': { action: 'read', subject: 'Employee', roles: ['EMPLOYEE'] },
  '/modules/employee-management': { action: 'read', subject: 'Employee', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'] },
  '/modules/customer-management': { action: 'read', subject: 'Customer', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'] },
  '/modules/equipment-management': { action: 'read', subject: 'Equipment', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'] },
  '/modules/maintenance-management': { action: 'read', subject: 'Maintenance', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR'] },
  '/modules/company-management': { action: 'manage', subject: 'Company', roles: ['SUPER_ADMIN', 'ADMIN'] },
  '/modules/rental-management': { action: 'read', subject: 'Rental', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'] },
  '/modules/quotation-management': { action: 'read', subject: 'Quotation', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'] },
  '/modules/payroll-management': { action: 'read', subject: 'Payroll', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR'] },
  '/modules/timesheet-management': { action: 'read', subject: 'Timesheet', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE'] },
  '/modules/project-management': { action: 'read', subject: 'Project', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'] },
  '/modules/leave-management': { action: 'read', subject: 'Leave', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE'] },
  '/modules/location-management': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR'] },
  '/modules/user-management': { action: 'read', subject: 'User', roles: ['SUPER_ADMIN', 'ADMIN'] },
  '/modules/analytics': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR'] },
  '/modules/safety-management': { action: 'read', subject: 'Safety', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR'] },
  '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'EMPLOYEE', 'USER'] },
  '/modules/reporting': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR'] },
  '/modules/settings': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE', 'USER'] },
  '/modules/audit-compliance': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR'] },
  '/admin': { action: 'manage', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
  '/reports': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR'] },
};

// Helper function to check if user has required role or higher
export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const userRoleLevel = roleHierarchy[userRole] || 7;
  
  return requiredRoles.some(requiredRole => {
    const requiredRoleLevel = roleHierarchy[requiredRole] || 7;
    return userRoleLevel <= requiredRoleLevel; // Lower number = higher priority
  });
}

// Helper function to check if user has permission
export function hasPermission(user: User, action: Action, subject: Subject): boolean {
  if (!user || !user.isActive) return false;
  
  const role = user.role?.toUpperCase() as UserRole || 'USER';
  const permissions = rolePermissions[role];
  
  if (!permissions) return false;
  
  // Check if user has the specific permission
  const hasCanPermission = permissions.can.some(permission => 
    (permission.action === action || permission.action === 'manage') && 
    (permission.subject === subject || permission.subject === 'all')
  );
  
  if (!hasCanPermission) return false;
  
  // Check if there are any restrictions
  if (permissions.cannot) {
    const hasCannotPermission = permissions.cannot.some(permission => 
      permission.action === action && permission.subject === subject
    );
    if (hasCannotPermission) return false;
  }
  
  return true;
}

// Helper function to get user's allowed actions for a subject
export function getAllowedActions(user: User, subject: Subject): Action[] {
  if (!user || !user.isActive) return [];
  
  const role = user.role?.toUpperCase() as UserRole || 'USER';
  const permissions = rolePermissions[role];
  
  if (!permissions) return [];
  
  const actions: Action[] = ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import', 'sync', 'reset'];
  
  return actions.filter(action => hasPermission(user, action, subject));
}

// Helper function to check if user can access a specific route
export function canAccessRoute(user: User, route: string): boolean {
  const routePermission = routePermissions[route];
  if (!routePermission) return true; // Allow access if no specific permission defined
  
  return hasRequiredRole(user.role, routePermission.roles) && 
         hasPermission(user, routePermission.action, routePermission.subject);
}

// Helper function to get user's role permissions
export function getRolePermissions(role: UserRole): any {
  return rolePermissions[role] || rolePermissions.USER;
}

// Helper function to create a user object from session
export function createUserFromSession(session: any): User | null {
  if (!session?.user) return null;
  
  let role = (session.user.role || 'USER').toUpperCase() as UserRole;
  
  // ALWAYS ensure admin@ias.com has SUPER_ADMIN role
  if (session.user.email === 'admin@ias.com') {
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
