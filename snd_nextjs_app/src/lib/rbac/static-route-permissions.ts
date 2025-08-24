export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import' | 'sync' | 'reset';
export type Subject = string;
export type UserRole = string;

export interface RoutePermission {
  action: Action;
  subject: Subject;
  roles: UserRole[];
}

// Static route permissions for middleware (Edge Runtime compatible)
export const getStaticRoutePermissions = (pathname: string): RoutePermission | null => {
  // Define route permissions with static role checking
  const routeConfigs: Record<string, { action: Action; subject: Subject; roles: UserRole[] }> = {
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
    '/modules/analytics': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/safety-management': { action: 'read', subject: 'Safety', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/reporting': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/settings': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/audit-compliance': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/admin': { action: 'manage', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
    '/reports': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
  };

  const config = routeConfigs[pathname];
  if (!config) {
    return null; // No permission required for this route
  }

  return {
    action: config.action,
    subject: config.subject,
    roles: config.roles,
  };
};
