// Import removed since we're not using database queries in middleware

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import' | 'sync' | 'reset';
export type Subject = string;
export type UserRole = string;

export interface RoutePermission {
  action: Action;
  subject: Subject;
  roles: UserRole[];
}

// Simplified route permissions - no database queries in middleware
export const getRoutePermissions = (pathname: string): RoutePermission | null => {
  // Define route permissions with hardcoded roles for reliability
  const routeConfigs: Record<string, RoutePermission> = {
    '/dashboard': { 
      action: 'read', 
      subject: 'Settings', 
      roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'USER'] 
    },
    '/employee-dashboard': { 
      action: 'read', 
      subject: 'Employee', 
      roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] 
    },
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
    '/modules/user-management': { 
      action: 'read', 
      subject: 'User', 
      roles: ['SUPER_ADMIN', 'ADMIN'] 
    },
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
    '/admin': { 
      action: 'manage', 
      subject: 'Settings', 
      roles: ['SUPER_ADMIN', 'ADMIN'] 
    },
    '/reports': {
      action: 'read',
      subject: 'Report',
      roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
    },
  };

  // Try exact match first
  if (routeConfigs[pathname]) {
    return routeConfigs[pathname];
  }

  // If no exact match, try to find a pattern match for module routes
  for (const route in routeConfigs) {
    if (route.startsWith('/modules/') && pathname.startsWith(route)) {
      return routeConfigs[route];
    }
  }

  return null; // No permission required for this route
};

// Check if user has access to a specific route
export const hasRouteAccess = (userRole: UserRole, pathname: string): boolean => {
  try {
    const routePermission = getRoutePermissions(pathname);
    
    if (!routePermission) {
      return true; // No permission required for this route
    }

    // Check if user's role is in the allowed roles
    return routePermission.roles.includes(userRole);
  } catch (error) {
    console.error('Error checking route access:', error);
    return false;
  }
};

// Get all available routes with their permissions (for admin interface)
export const getAllRoutePermissions = (): Record<string, RoutePermission> => {
  try {
    const routes = [
      '/dashboard',
      '/employee-dashboard',
      '/modules/employee-management',
      '/modules/customer-management',
      '/modules/equipment-management',
      '/modules/maintenance-management',
      '/modules/company-management',
      '/modules/rental-management',
      '/modules/quotation-management',
      '/modules/payroll-management',
      '/modules/timesheet-management',
      '/modules/project-management',
      '/modules/leave-management',
      '/modules/location-management',
      '/modules/user-management',
      '/modules/analytics',
      '/modules/safety-management',
      '/modules/salary-increments',
      '/modules/reporting',
      '/modules/settings',
      '/modules/audit-compliance',
      '/admin',
      '/reports',
    ];

    const permissions: Record<string, RoutePermission> = {};
    
    for (const route of routes) {
      const permission = getRoutePermissions(route);
      if (permission !== null) {
        permissions[route] = permission;
      }
    }

    return permissions;
  } catch (error) {
    console.error('Error getting all route permissions:', error);
    return {};
  }
};

// Dynamic function to get route permissions from database (for admin interface)
export const getDynamicRoutePermissions = async (pathname: string): Promise<RoutePermission | null> => {
  try {
    // For now, return the same as the static version until priority column is added
    return getRoutePermissions(pathname);
  } catch (error) {
    console.error('Error getting dynamic route permissions:', error);
    return null;
  }
};
