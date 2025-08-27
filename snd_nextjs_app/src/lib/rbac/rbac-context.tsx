'use client';

import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useMemo } from 'react';

// Client-safe types and interfaces
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

interface RBACContextType {
  user: User | null;
  hasPermission: (action: string, subject: string) => boolean;
  getAllowedActions: (subject: string) => string[];
  canAccessRoute: (route: string) => boolean;
  isLoading: boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: React.ReactNode;
}

// Dynamic role hierarchy configuration (can be updated without code changes)
const DYNAMIC_ROLE_HIERARCHY: Record<string, number> = {
  'SUPER_ADMIN': 1,
  'ADMIN': 2,
  'MANAGER': 3,
  'SUPERVISOR': 4,
  'OPERATOR': 5,
  'EMPLOYEE': 6,
  'USER': 7,
  // Add new roles here with appropriate priority numbers
  // Lower number = higher priority
  'PROJECT_LEADER': 4, // Same priority as SUPERVISOR
  'FINANCE_SPECIALIST': 5, // Same priority as OPERATOR
  'HR_SPECIALIST': 5, // Same priority as OPERATOR
  'SALES_REPRESENTATIVE': 5, // Same priority as OPERATOR
};

// Dynamic fallback permissions configuration (can be updated without code changes)
const DYNAMIC_FALLBACK_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*', 'manage.all'],
  ADMIN: [
    'manage.User', 'manage.Employee', 'manage.Customer', 'manage.Equipment',
    'manage.Rental', 'manage.Quotation', 'manage.Payroll', 'manage.Timesheet',
    'manage.Project', 'manage.Leave', 'manage.Department', 'manage.Designation',
    'manage.Report', 'manage.Settings', 'manage.Company', 'manage.Safety',
    'manage.employee-document', 'manage.SalaryIncrement', 'manage.Advance',
    'manage.Assignment', 'manage.Location', 'manage.Maintenance'
  ],
  MANAGER: [
    'read.User', 'manage.Employee', 'manage.Customer', 'manage.Equipment',
    'manage.Rental', 'manage.Quotation', 'read.Payroll', 'manage.Timesheet',
    'manage.Project', 'manage.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'read.Safety',
    'manage.employee-document', 'manage.SalaryIncrement', 'manage.Advance',
    'manage.Assignment', 'read.Location', 'read.Maintenance'
  ],
  SUPERVISOR: [
    'read.User', 'manage.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'manage.Quotation', 'read.Payroll', 'manage.Timesheet',
    'manage.Project', 'manage.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'read.Safety',
    'manage.employee-document', 'read.SalaryIncrement', 'read.Advance',
    'read.Assignment', 'read.Location', 'read.Maintenance'
  ],
  OPERATOR: [
    'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'read.Quotation', 'read.Payroll', 'read.Timesheet',
    'read.Project', 'read.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'read.Safety',
    'read.employee-document', 'read.SalaryIncrement', 'read.Advance',
    'read.Assignment', 'read.Location', 'read.Maintenance'
  ],
  EMPLOYEE: [
    'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'read.Quotation', 'read.Payroll', 'manage.Timesheet',
    'read.Project', 'manage.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'manage.employee-document',
    'read.SalaryIncrement'
  ],
  USER: [
    'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'read.Quotation', 'read.Timesheet', 'read.Project',
    'read.Leave', 'read.Department', 'read.Settings', 'read.Report',
    'read.Company', 'read.employee-document', 'read.SalaryIncrement'
  ],
  // New roles with their permissions
  PROJECT_LEADER: [
    'manage.Project', 'manage.project-task', 'manage.project-milestone',
    'read.Employee', 'read.Timesheet', 'read.Report', 'read.Project',
    'read.Customer', 'read.Equipment'
  ],
  FINANCE_SPECIALIST: [
    'read.Payroll', 'read.SalaryIncrement', 'read.Advance', 'read.Report',
    'read.Employee', 'export.Report', 'read.Project', 'read.Customer',
    'read.Equipment', 'read.Timesheet'
  ],
  HR_SPECIALIST: [
    'read.Employee', 'manage.Leave', 'read.performance-review', 'read.Training',
    'read.Report', 'read.User', 'read.Department', 'read.Designation',
    'manage.employee-document', 'read.SalaryIncrement'
  ],
  SALES_REPRESENTATIVE: [
    'read.Customer', 'manage.Quotation', 'read.Project', 'read.Report',
    'export.Report', 'read.Employee', 'read.Equipment', 'read.Timesheet'
  ],
};

// Client-side permission checking (dynamic system)
function hasPermissionClient(user: User, action: Action, subject: Subject): boolean {
  // Get permissions for user's role from dynamic configuration
  const userPermissions = DYNAMIC_FALLBACK_PERMISSIONS[user.role] || [];
  
  // Check for wildcard permissions
  if (userPermissions.includes('*') || userPermissions.includes('manage.all')) {
    return true;
  }

  // Check for specific permission
  const permissionName = `${action}.${subject}`;
  return userPermissions.includes(permissionName);
}

// Client-side route access checking (dynamic system)
function canAccessRouteClient(user: User, route: string): boolean {
  // Define route permission mappings for client-side
  const routePermissions: Record<string, { action: Action; subject: Subject; roles: UserRole[] }> = {
    '/dashboard': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'PROJECT_LEADER', 'FINANCE_SPECIALIST', 'HR_SPECIALIST', 'SALES_REPRESENTATIVE'] },
    '/employee-dashboard': { action: 'read', subject: 'Employee', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'PROJECT_LEADER', 'FINANCE_SPECIALIST', 'HR_SPECIALIST'] },
    '/modules/employee-management': { action: 'read', subject: 'Employee', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'PROJECT_LEADER', 'FINANCE_SPECIALIST', 'HR_SPECIALIST'] },
    '/modules/customer-management': { action: 'read', subject: 'Customer', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'PROJECT_LEADER', 'SALES_REPRESENTATIVE'] },
    '/modules/equipment-management': { action: 'read', subject: 'Equipment', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'PROJECT_LEADER', 'FINANCE_SPECIALIST', 'SALES_REPRESENTATIVE'] },
    '/modules/maintenance-management': { action: 'read', subject: 'Maintenance', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROJECT_LEADER'] },
    '/modules/company-management': { action: 'manage', subject: 'Company', roles: ['SUPER_ADMIN', 'ADMIN'] },
    '/modules/rental-management': { action: 'read', subject: 'Rental', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'PROJECT_LEADER', 'SALES_REPRESENTATIVE'] },
    '/modules/quotation-management': { action: 'read', subject: 'Quotation', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'SALES_REPRESENTATIVE'] },
    '/modules/payroll-management': { action: 'read', subject: 'Payroll', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'FINANCE_SPECIALIST'] },
    '/modules/timesheet-management': { action: 'read', subject: 'Timesheet', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'PROJECT_LEADER', 'FINANCE_SPECIALIST', 'HR_SPECIALIST'] },
    '/modules/project-management': { action: 'read', subject: 'Project', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'PROJECT_LEADER', 'SALES_REPRESENTATIVE'] },
    '/modules/leave-management': { action: 'read', subject: 'Leave', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'HR_SPECIALIST'] },
    '/modules/location-management': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROJECT_LEADER'] },
    '/modules/user-management': { action: 'read', subject: 'User', roles: ['SUPER_ADMIN', 'ADMIN', 'HR_SPECIALIST'] },
    '/modules/analytics': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROJECT_LEADER', 'FINANCE_SPECIALIST', 'HR_SPECIALIST', 'SALES_REPRESENTATIVE'] },
    '/modules/safety-management': { action: 'read', subject: 'Safety', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROJECT_LEADER'] },
    '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'FINANCE_SPECIALIST', 'HR_SPECIALIST'] },
    '/modules/reporting': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROJECT_LEADER', 'FINANCE_SPECIALIST', 'HR_SPECIALIST', 'SALES_REPRESENTATIVE'] },
    '/modules/settings': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE', 'PROJECT_LEADER', 'FINANCE_SPECIALIST', 'HR_SPECIALIST', 'SALES_REPRESENTATIVE'] },
    '/modules/audit-compliance': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROJECT_LEADER'] },
    '/admin': { action: 'manage', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
    '/reports': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROJECT_LEADER', 'FINANCE_SPECIALIST', 'HR_SPECIALIST', 'SALES_REPRESENTATIVE'] },
  };

  const routePermission = routePermissions[route];
  if (!routePermission) return true; // Allow access if no specific permission defined

  // Check if user has required role
  return routePermission.roles.includes(user.role);
}

// Client-side allowed actions (dynamic system)
function getAllowedActionsClient(user: User, subject: Subject): string[] {
  const actions: Action[] = ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import', 'sync', 'reset'];
  
  return actions.filter(action => hasPermissionClient(user, action, subject));
}

// Dynamic role management functions (can be called to update roles)
export function addNewRoleClient(roleName: string, priority: number, permissions: string[]): void {
  // Add to role hierarchy
  DYNAMIC_ROLE_HIERARCHY[roleName] = priority;
  
  // Add to fallback permissions
  DYNAMIC_FALLBACK_PERMISSIONS[roleName] = permissions;
  
  console.log(`✅ Added new role: ${roleName} with priority ${priority} and ${permissions.length} permissions`);
}

export function removeRoleClient(roleName: string): void {
  delete DYNAMIC_ROLE_HIERARCHY[roleName];
  delete DYNAMIC_FALLBACK_PERMISSIONS[roleName];
  
  console.log(`🗑️ Removed role: ${roleName}`);
}

export function updateRolePermissionsClient(roleName: string, permissions: string[]): void {
  if (DYNAMIC_FALLBACK_PERMISSIONS[roleName]) {
    DYNAMIC_FALLBACK_PERMISSIONS[roleName] = permissions;
    console.log(`✅ Updated permissions for role: ${roleName}`);
  } else {
    console.warn(`⚠️ Role ${roleName} not found, cannot update permissions`);
  }
}

export function getAllRolesClient(): string[] {
  return Object.keys(DYNAMIC_ROLE_HIERARCHY);
}

export function getRolePriorityClient(roleName: string): number {
  return DYNAMIC_ROLE_HIERARCHY[roleName] || 999;
}

export function RBACProvider({ children }: RBACProviderProps) {
  const { data: session, status } = useSession();

  const user: User | null = useMemo(() => {
    // Handle loading state
    if (status === 'loading') {
      return null;
    }

    // Handle unauthenticated state
    if (!session?.user) {
      return null;
    }

    // Create user object from session
    return {
      id: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || '',
      role: (session.user.role as UserRole) || 'USER',
      isActive: session.user.isActive !== false,
    };
  }, [session, status]);

  const contextValue: RBACContextType = useMemo(
    () => ({
      user,
      hasPermission: (action: string, subject: string) => {
        if (!user) return false;
        return hasPermissionClient(user, action as Action, subject as Subject);
      },
      getAllowedActions: (subject: string) => {
        if (!user) return [];
        return getAllowedActionsClient(user, subject as Subject);
      },
      canAccessRoute: (route: string) => {
        if (!user) return false;
        return canAccessRouteClient(user, route);
      },
      isLoading: status === 'loading',
    }),
    [user, status]
  );

  return <RBACContext.Provider value={contextValue}>{children}</RBACContext.Provider>;
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}

export function usePermission() {
  const { hasPermission } = useRBAC();
  return { hasPermission };
}

export function useRouteAccess() {
  const { canAccessRoute } = useRBAC();
  return { canAccessRoute };
}

export function useAllowedActions() {
  const { getAllowedActions } = useRBAC();
  return { getAllowedActions };
}
