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
    'manage.Rental', 'manage.Quotation', 'manage.Payroll', 'manage.Timesheet', 'approve.Timesheet', 'reject.Timesheet',
    'approve.Timesheet.Foreman', 'approve.Timesheet.Incharge', 'approve.Timesheet.Checking', 'approve.Timesheet.Manager',
    'manage.Project', 'manage.Leave', 'manage.Department', 'manage.Designation',
    'manage.Report', 'manage.Settings', 'manage.Company', 'manage.Safety',
    'manage.SalaryIncrement', 'manage.Advance',
    'manage.Assignment', 'manage.Location', 'manage.Maintenance', 'manage.Document'
  ],
  MANAGER: [
    'read.User', 'manage.Employee', 'manage.Customer', 'manage.Equipment',
    'manage.Rental', 'manage.Quotation', 'read.Payroll', 'manage.Timesheet', 'approve.Timesheet', 'reject.Timesheet',
    'approve.Timesheet.Manager',
    'manage.Project', 'manage.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'read.Safety',
    'manage.SalaryIncrement', 'manage.Advance',
    'manage.Assignment', 'read.Location', 'read.Maintenance', 'manage.Document'
  ],
  SUPERVISOR: [
    'read.User', 'manage.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'manage.Quotation', 'read.Payroll', 'manage.Timesheet', 'approve.Timesheet', 'reject.Timesheet',
    'approve.Timesheet.Foreman', 'approve.Timesheet.Incharge',
    'manage.Project', 'manage.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'read.Safety',
    'read.SalaryIncrement', 'read.Advance',
    'read.Assignment', 'read.Location', 'read.Maintenance', 'read.Document'
  ],
  OPERATOR: [
    'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'read.Quotation', 'read.Payroll', 'read.Timesheet',
    'read.Project', 'read.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company', 'read.Safety',
    'read.SalaryIncrement', 'read.Advance',
    'read.Assignment', 'read.Location', 'read.Maintenance', 'read.Document'
  ],
  EMPLOYEE: [
    'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'read.Quotation', 'read.Payroll', 'manage.Timesheet',
    'read.Project', 'manage.Leave', 'read.Department', 'read.Designation',
    'read.Report', 'read.Settings', 'read.Company',
    'read.SalaryIncrement', 'read.Document'
  ],
  USER: [
    'read.User', 'read.Employee', 'read.Customer', 'read.Equipment',
    'read.Rental', 'read.Quotation', 'read.Timesheet', 'read.Project',
    'read.Leave', 'read.Department', 'read.Settings', 'read.Report',
    'read.Company', 'read.SalaryIncrement', 'read.Document'
  ],
  // New roles with their permissions
  PROJECT_LEADER: [
    'manage.Project', 'manage.project-task', 'manage.project-milestone',
    'read.Employee', 'read.Timesheet', 'read.Report', 'read.Project',
    'read.Customer', 'read.Equipment'
  ],
  // Timesheet approval stage roles
  FOREMAN: [
    'read.Employee', 'read.Timesheet', 'approve.Timesheet.Foreman',
    'read.Project', 'read.Report'
  ],
  TIMESHEET_INCHARGE: [
    'read.Employee', 'read.Timesheet', 'approve.Timesheet.Incharge',
    'read.Project', 'read.Report'
  ],
  TIMESHEET_CHECKER: [
    'read.Employee', 'read.Timesheet', 'approve.Timesheet.Checking',
    'read.Project', 'read.Report'
  ],
  FINANCE_SPECIALIST: [
    'read.Payroll', 'read.SalaryIncrement', 'read.Advance', 'read.Report',
    'read.Employee', 'export.Report', 'read.Project', 'read.Customer',
    'read.Equipment', 'read.Timesheet'
  ],
  HR_SPECIALIST: [
    'read.Employee', 'manage.Leave', 'read.performance-review', 'read.Training',
    'read.Report', 'read.User', 'read.Department', 'read.Designation',
    'read.SalaryIncrement'
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
  // All routes now use permission-based access instead of hardcoded role restrictions
  const routePermissions: Record<string, { action: Action; subject: Subject; roles: UserRole[] }> = {
    '/': { action: 'read', subject: 'Dashboard', roles: [] },
    '/dashboard': { action: 'read', subject: 'Dashboard', roles: [] },
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
    '/admin': { action: 'manage', subject: 'Admin', roles: [] },
    '/reports': { action: 'read', subject: 'Report', roles: [] },
  };

  const routePermission = routePermissions[route];
  if (!routePermission) return true; // Allow access if no specific permission defined

  // If roles array is empty, check permissions (no role restrictions)
  if (routePermission.roles.length === 0) {
    // Check if user has the required permission for this route
    return hasPermissionClient(user, routePermission.action, routePermission.subject);
  }
  
  // If there are role restrictions, check if user has required role
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
