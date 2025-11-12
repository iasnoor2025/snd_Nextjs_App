'use client';

import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useMemo, useEffect, useRef } from 'react';

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
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: React.ReactNode;
}

// Dynamic role hierarchy configuration (matches database priorities)
const DYNAMIC_ROLE_HIERARCHY: Record<string, number> = {
  'SUPER_ADMIN': 1,        // Highest priority - Full system access
  'ADMIN': 2,              // Administrative access
  'MANAGER': 3,            // Management access
  'SUPERVISOR': 4,         // Supervisory access
  'OPERATOR': 5,           // Operational access
  'EMPLOYEE': 6,           // Employee access
  'FINANCE_SPECIALIST': 7, // Finance specialist
  'HR_SPECIALIST': 8,      // HR specialist
  'SALES_REPRESENTATIVE': 9, // Sales representative
  'USER': 999,             // Lowest priority - Basic user access
};

// Dynamic fallback permissions configuration (can be updated without code changes)
const DYNAMIC_FALLBACK_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*', 'manage.all'],
};

// Cache TTL: 5 minutes in milliseconds
const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000;

// Cache key for localStorage
const getCacheKey = (userId: string) => `rbac_permissions_${userId}`;
const getCacheTimestampKey = (userId: string) => `rbac_permissions_timestamp_${userId}`;
const getCacheRoleKey = (userId: string) => `rbac_permissions_role_${userId}`;

// In-memory cache for faster access
const userPermissionsCache = new Map<string, { permissions: string[]; timestamp: number; role: string }>();

// Function to get user permissions from cache (checks both memory and localStorage)
function getUserPermissionsFromCache(userId: string): string[] | undefined {
  // Check in-memory cache first
  const memoryCache = userPermissionsCache.get(userId);
  if (memoryCache) {
    const now = Date.now();
    // Check if cache is still valid
    if (now - memoryCache.timestamp < PERMISSIONS_CACHE_TTL) {
      return memoryCache.permissions;
    }
  }

  // Check localStorage
  if (typeof window !== 'undefined') {
    try {
      const cachedPermissions = localStorage.getItem(getCacheKey(userId));
      const cachedTimestamp = localStorage.getItem(getCacheTimestampKey(userId));
      const cachedRole = localStorage.getItem(getCacheRoleKey(userId));

      if (cachedPermissions && cachedTimestamp && cachedRole) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        // Check if cache is still valid
        if (now - timestamp < PERMISSIONS_CACHE_TTL) {
          const permissions = JSON.parse(cachedPermissions);
          // Store in memory cache for faster access
          userPermissionsCache.set(userId, {
            permissions,
            timestamp,
            role: cachedRole,
          });
          return permissions;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(getCacheKey(userId));
          localStorage.removeItem(getCacheTimestampKey(userId));
          localStorage.removeItem(getCacheRoleKey(userId));
        }
      }
    } catch (error) {
      console.error('Error reading permissions from localStorage:', error);
    }
  }

  return undefined;
}

// Function to set user permissions in cache (both memory and localStorage)
function setUserPermissionsInCache(userId: string, permissions: string[], role: string): void {
  const timestamp = Date.now();

  // Store in memory cache
  userPermissionsCache.set(userId, {
    permissions,
    timestamp,
    role,
  });

  // Store in localStorage for persistence across page refreshes
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getCacheKey(userId), JSON.stringify(permissions));
      localStorage.setItem(getCacheTimestampKey(userId), timestamp.toString());
      localStorage.setItem(getCacheRoleKey(userId), role);
    } catch (error) {
      console.error('Error saving permissions to localStorage:', error);
    }
  }
}

// Function to clear user permissions cache
function clearUserPermissionsCache(userId: string): void {
  userPermissionsCache.delete(userId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(getCacheKey(userId));
      localStorage.removeItem(getCacheTimestampKey(userId));
      localStorage.removeItem(getCacheRoleKey(userId));
    } catch (error) {
      console.error('Error clearing permissions from localStorage:', error);
    }
  }
}

// Function to load user permissions from API and cache them
async function loadUserPermissions(userId: string, userRole: string, forceRefresh = false): Promise<string[]> {
  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = getUserPermissionsFromCache(userId);
    if (cached) {
      // Verify role hasn't changed
      const cachedRole = userPermissionsCache.get(userId)?.role || 
                        (typeof window !== 'undefined' ? localStorage.getItem(getCacheRoleKey(userId)) : null);
      if (cachedRole === userRole) {
        // Using cached permissions - no log needed (silent cache hit)
        return cached;
      } else {
        // Role changed, clear cache
        clearUserPermissionsCache(userId);
      }
    }
  }

  try {
    // Fetch from API (without cache-busting timestamp to allow browser caching)
    const response = await fetch('/api/user-permissions', {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensure cookies are sent
    });
    
    if (!response.ok) {
      // Log error details for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Failed to load user permissions: ${response.status} ${response.statusText}`);
      }
      // Return empty array if API call fails
      return [];
    }
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.permissions)) {
      // Only log in development mode to reduce console noise
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Loaded user permissions from API:', data.permissions.slice(0, 5), data.permissions.length > 5 ? '...' : '');
      }
      setUserPermissionsInCache(userId, data.permissions, userRole);
      return data.permissions;
    } else {
      // Log if response format is unexpected
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Unexpected response format from user-permissions API:', data);
      }
      return [];
    }
  } catch (error) {
    // Log error with more details
    console.error('❌ Failed to load user permissions:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    // Return empty array on error to prevent app crash
    return [];
  }
}

// Client-side permission checking (permission-based system)
function hasPermissionClient(user: User, action: Action, subject: Subject): boolean {
  // For ALL roles (including SUPER_ADMIN), check against cached permissions
  const userPermissions = getUserPermissionsFromCache(user.id);
  
  // If no permissions loaded yet, allow access temporarily to prevent flash of access denied
  // This happens on page refresh before permissions are loaded
  if (!userPermissions) {
    // For SUPER_ADMIN, allow access immediately while permissions load
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }
    return false;
  }
  
  // Check for wildcard permissions
  if (userPermissions.includes('*') || userPermissions.includes('manage.all')) {
    return true;
  }
  
  // Check for specific permission (case-insensitive)
  const permissionName = `${action}.${subject}`;
  const permissionNameLower = `${action}.${subject.toLowerCase()}`;
  
  // Check both capitalized and lowercase versions
  if (userPermissions.includes(permissionName) || userPermissions.includes(permissionNameLower)) {
    return true;
  }
  
  // Check if user has manage permission for the subject (which includes read, create, update, delete)
  const managePermission = `manage.${subject}`;
  const managePermissionLower = `manage.${subject.toLowerCase()}`;
  
  if (userPermissions.includes(managePermission) || userPermissions.includes(managePermissionLower)) {
    return true;
  }
  
  return false;
}

// Client-side route access checking (dynamic system)
function canAccessRouteClient(user: User, route: string): boolean {
  // Define route permission mappings for client-side
  const routePermissions: Record<string, { action: Action; subject: Subject; roles: UserRole[] }> = {
    '/': { action: 'read', subject: 'Dashboard', roles: [] },
    '/dashboard': { action: 'read', subject: 'Dashboard', roles: [] },
    '/employee-dashboard': { action: 'read', subject: 'mydashboard', roles: [] },
    '/profile': { action: 'read', subject: 'own-profile', roles: [] },
    '/employee-management': { action: 'read', subject: 'Employee', roles: [] },
    '/customer-management': { action: 'read', subject: 'Customer', roles: [] },
    '/equipment-management': { action: 'read', subject: 'Equipment', roles: [] },
    '/maintenance-management': { action: 'read', subject: 'Maintenance', roles: [] },
    '/company-management': { action: 'manage', subject: 'Company', roles: [] },
    '/rental-management': { action: 'read', subject: 'Rental', roles: [] },
    '/quotation-management': { action: 'read', subject: 'Quotation', roles: [] },
    '/payroll-management': { action: 'read', subject: 'Payroll', roles: [] },
    '/timesheet-management': { action: 'read', subject: 'Timesheet', roles: [] },
    '/project-management': { action: 'read', subject: 'Project', roles: [] },
    '/leave-management': { action: 'read', subject: 'Leave', roles: [] },
    '/location-management': { action: 'read', subject: 'Settings', roles: [] },
    '/user-management': { action: 'read', subject: 'User', roles: [] },
    '/safety-management': { action: 'read', subject: 'Safety', roles: [] },
    '/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: [] },
    '/reporting': { action: 'read', subject: 'Report', roles: [] },
    '/document-management': { action: 'read', subject: 'Document', roles: [] },
    '/admin': { action: 'manage', subject: 'Admin', roles: [] },
    '/reports': { action: 'read', subject: 'Report', roles: [] },
    // Keep old /modules/ routes for backward compatibility during migration
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
    '/modules/safety-management': { action: 'read', subject: 'Safety', roles: [] },
    '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: [] },
    '/modules/reporting': { action: 'read', subject: 'Report', roles: [] },
    '/modules/document-management': { action: 'read', subject: 'Document', roles: [] },
  };

  const routePermission = routePermissions[route];
  
  if (!routePermission) {
    return true; // Allow access if no specific permission defined
  }

  // If roles array is empty, check permissions (no role restrictions)
  if (routePermission.roles.length === 0) {
    const hasAccess = hasPermissionClient(user, routePermission.action, routePermission.subject);
    return hasAccess;
  }
  
  // If roles array has specific roles, check if user's role is in the list
  if (routePermission.roles.length > 0) {
    const hasRoleAccess = routePermission.roles.includes(user.role);
    return hasRoleAccess;
  }
  
  return routePermission.roles.includes(user.role);
}

// Client-side allowed actions (dynamic system)
function getAllowedActionsClient(user: User, subject: Subject): string[] {
  const actions: Action[] = ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import', 'sync', 'reset'];
  
  return actions.filter(action => hasPermissionClient(user, action, subject));
}

// Dynamic role management functions
export function addNewRoleClient(roleName: string, priority: number, permissions: string[]): void {
  DYNAMIC_ROLE_HIERARCHY[roleName] = priority;
}

export function removeRoleClient(roleName: string): void {
  delete DYNAMIC_ROLE_HIERARCHY[roleName];
}

export function updateRolePermissionsClient(roleName: string, permissions: string[]): void {
  // Implementation for updating role permissions
}

export function getAllRolesClient(): string[] {
  return Object.keys(DYNAMIC_ROLE_HIERARCHY);
}

export function getRolePriorityClient(roleName: string): number {
  return DYNAMIC_ROLE_HIERARCHY[roleName] || 999;
}

export function RBACProvider({ children }: RBACProviderProps) {
  const { data: session, status } = useSession();
  const permissionsLoadingRef = useRef<Map<string, Promise<string[]>>>(new Map());
  const [permissionsLoading, setPermissionsLoading] = React.useState(false);

  const user: User | null = useMemo(() => {
    if (status === 'loading') {
      return null;
    }

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || '',
      role: (session.user.role as UserRole) || 'USER',
      isActive: session.user.isActive !== false,
    };
  }, [session, status]);

  // Load user permissions when user changes - but only once per user and only if not cached
  useEffect(() => {
    if (!user) {
      // Clear cache when user logs out
      if (typeof window !== 'undefined') {
        // Clear all permission caches
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('rbac_permissions_')) {
            localStorage.removeItem(key);
          }
        });
        userPermissionsCache.clear();
      }
      setPermissionsLoading(false);
      return;
    }

    // Check if permissions are already cached and valid
    const cached = getUserPermissionsFromCache(user.id);
    if (cached) {
      // Verify role hasn't changed
      const cachedRole = userPermissionsCache.get(user.id)?.role || 
                        (typeof window !== 'undefined' ? localStorage.getItem(getCacheRoleKey(user.id)) : null);
      if (cachedRole === user.role) {
        // Permissions are cached, role matches, and cache is valid - skip loading entirely
        setPermissionsLoading(false);
        return;
      } else {
        // Role changed, clear cache
        clearUserPermissionsCache(user.id);
      }
    }

    // Check if permissions are already being loaded
    const existingPromise = permissionsLoadingRef.current.get(user.id);
    if (existingPromise) {
      // Already loading, ensure loading state is true
      // The existing promise will set it to false when done
      setPermissionsLoading(true);
      return;
    }

    // Start loading permissions
    setPermissionsLoading(true);
    const loadPromise = loadUserPermissions(user.id, user.role, false)
      .catch(() => {
        // Silent error handling for production
        return [];
      })
      .finally(() => {
        permissionsLoadingRef.current.delete(user.id);
        setPermissionsLoading(false);
      });
    
    permissionsLoadingRef.current.set(user.id, loadPromise);
  }, [user?.id, user?.role]);

  const refreshPermissions = async () => {
    if (user) {
      setPermissionsLoading(true);
      try {
        await loadUserPermissions(user.id, user.role, true);
      } finally {
        setPermissionsLoading(false);
      }
    }
  };

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
      isLoading: status === 'loading' || permissionsLoading,
      refreshPermissions,
    }),
    [user, status, permissionsLoading]
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
