'use client';

import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useMemo, useEffect } from 'react';

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
  'SUPER_ADMIN': 1, // Always highest priority
  // All other roles will be assigned priorities dynamically
  'ADMIN': 2, // Will be assigned dynamically
  // 'MANAGER': 3, // Will be assigned dynamically
  // 'SUPERVISOR': 4, // Will be assigned dynamically
  // 'OPERATOR': 5, // Will be assigned dynamically
  // 'EMPLOYEE': 6, // Will be assigned dynamically
  // 'USER': 7, // Will be assigned dynamically
};

// Dynamic fallback permissions configuration (can be updated without code changes)
const DYNAMIC_FALLBACK_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*', 'manage.all'],
  // ADMIN: [],
  // All other roles start with empty permissions - they must be assigned dynamically
  // MANAGER: [], // Will be populated dynamically
  // SUPERVISOR: [], // Will be populated dynamically
  // OPERATOR: [], // Will be populated dynamically
  // EMPLOYEE: [], // Will be populated dynamically
  // USER: [], // Will be populated dynamically
  // PROJECT_LEADER: [], // Will be populated dynamically
  // FOREMAN: [], // Will be populated dynamically
  // TIMESHEET_INCHARGE: [], // Will be populated dynamically
  // TIMESHEET_CHECKER: [], // Will be populated dynamically
  // FINANCE_SPECIALIST: [], // Will be populated dynamically
  // HR_SPECIALIST: [], // Will be populated dynamically
  // SALES_REPRESENTATIVE: [], // Will be populated dynamically
};

// Cache for user permissions
const userPermissionsCache = new Map<string, string[]>();

// Function to get user permissions from cache
function getUserPermissionsFromCache(userId: string): string[] | undefined {
  return userPermissionsCache.get(userId);
}

// Function to set user permissions in cache
function setUserPermissionsInCache(userId: string, permissions: string[]): void {
  userPermissionsCache.set(userId, permissions);
}

// Function to load user permissions from API and cache them
async function loadUserPermissions(userId: string): Promise<string[]> {
  try {
    const response = await fetch('/api/user-permissions');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.permissions) {
        setUserPermissionsInCache(userId, data.permissions);
        return data.permissions;
      }
    }
  } catch (error) {
    console.error('Error loading user permissions:', error);
  }
  
  return [];
}

// Client-side permission checking (dynamic system)
function hasPermissionClient(user: User, action: Action, subject: Subject): boolean {
  // Permission check in progress
  
  // SUPER_ADMIN has all permissions
  if (user.role === 'SUPER_ADMIN') {
    // SUPER_ADMIN granted
    return true;
  }
  
  // For all other roles, check against cached permissions
  // The permissions are loaded when the user logs in and cached in the context
  const userPermissions = getUserPermissionsFromCache(user.id);
  // Using cached permissions
  
  if (!userPermissions) {
    // No cached permissions found
    return false;
  }
  
  // Check for wildcard permissions
  if (userPermissions.includes('*') || userPermissions.includes('manage.all')) {
    // Wildcard permission granted
    return true;
  }
  
  // Check for specific permission
  const permissionName = `${action}.${subject}`;
  if (userPermissions.includes(permissionName)) {
    // Specific permission granted
    return true;
  }
  
  // Check if user has manage permission for the subject (which includes read, create, update, delete)
  const managePermission = `manage.${subject}`;
  if (userPermissions.includes(managePermission)) {
    // Manage permission granted
    return true;
  }
  
  // Permission denied
  return false;
}

// Client-side route access checking (dynamic system)
function canAccessRouteClient(user: User, route: string): boolean {
  // Define route permission mappings for client-side
  // All routes now use permission-based access instead of hardcoded role restrictions
  const routePermissions: Record<string, { action: Action; subject: Subject; roles: UserRole[] }> = {
    '/': { action: 'read', subject: 'Dashboard', roles: [] },
    '/dashboard': { action: 'read', subject: 'Dashboard', roles: [] },
    '/employee-dashboard': { action: 'read', subject: 'mydashboard', roles: [] },
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
  
  if (!routePermission) {
    return true; // Allow access if no specific permission defined
  }

  // If roles array is empty, check permissions (no role restrictions)
  if (routePermission.roles.length === 0) {
    // Check if user has the required permission for this route
    const hasAccess = hasPermissionClient(user, routePermission.action, routePermission.subject);
    
    // Special debug for employee-dashboard
    if (route === '/employee-dashboard') {
      console.log(`🎯 EMPLOYEE-DASHBOARD DEBUG:`);
      console.log(`  - User role: ${user.role}`);
      console.log(`  - Required permission: ${routePermission.action}.${routePermission.subject}`);
      console.log(`  - Has access: ${hasAccess}`);
      console.log(`  - Cached permissions:`, getUserPermissionsFromCache(user.id));
    }
    
    return hasAccess;
  }
  
  // If roles array has specific roles, check if user's role is in the list
  if (routePermission.roles.length > 0) {
    const hasRoleAccess = routePermission.roles.includes(user.role);
    console.log(`👥 Role-based access for route ${route}: ${hasRoleAccess ? '✅ GRANTED' : '❌ DENIED'} (user role: ${user.role}, required: ${routePermission.roles.join(', ')})`);
    return hasRoleAccess;
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

  // Load user permissions when user changes
  useEffect(() => {
    if (user) {
      loadUserPermissions(user.id).catch(error => {
        console.error(`Failed to load permissions for user ${user.id}:`, error);
      });
    }
  }, [user]);

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
