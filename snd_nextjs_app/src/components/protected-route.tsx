'use client';

import { Action, Subject, UserRole } from '@/lib/rbac/custom-rbac';
import { AccessDenied, RBACLoading } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: { action: Action; subject: Subject };
  requiredRoute?: string;
  fallback?: React.ReactNode;
}

// Helper function to check if permissions are cached (same logic as rbac-context)
function arePermissionsCached(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const cacheKey = `rbac_permissions_${userId}`;
    const timestampKey = `rbac_permissions_timestamp_${userId}`;
    const roleKey = `rbac_permissions_role_${userId}`;
    
    const cachedPermissions = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(timestampKey);
    const cachedRole = localStorage.getItem(roleKey);
    
    if (cachedPermissions && cachedTimestamp && cachedRole) {
      const timestamp = parseInt(cachedTimestamp, 10);
      const now = Date.now();
      const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
      
      // Check if cache is still valid
      if (now - timestamp < PERMISSIONS_CACHE_TTL) {
        return true;
      }
    }
  } catch (error) {
    // Ignore errors when checking cache
  }
  
  return false;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  requiredRoute,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission, canAccessRoute } = useRBAC();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      toast.error(t('common.rbac.pleaseSignIn'));
      router.push('/login');
    }
  }, [session, status, router, t]);

  // Track when permissions are loaded - check cache immediately
  useEffect(() => {
    if (user && !isLoading) {
      // Check if permissions are already cached
      const cached = arePermissionsCached(user.id);
      
      if (cached) {
        // Permissions are cached, mark as loaded immediately
        setPermissionsLoaded(true);
      } else {
        // Permissions not cached, wait a bit for API to load them
        // But set a maximum timeout to prevent infinite loading
        const timer = setTimeout(() => {
          setPermissionsLoaded(true);
        }, 1000); // Wait up to 1 second for permissions to load from API
        return () => clearTimeout(timer);
      }
    } else if (!user) {
      // If no user, reset permissions loaded state
      setPermissionsLoaded(false);
    }
  }, [user, isLoading]);

  // Show loading while checking authentication and permissions
  if (status === 'loading' || isLoading || !permissionsLoaded) {
    return <RBACLoading />;
  }

  // Check authentication
  if (!session) {
    return fallback || <RBACLoading message={t('common.rbac.redirectingToSignIn')} />;
  }

  // Check role-based access
  if (requiredRole && user) {
    const userRole = user.role;
    const requiredRoleUpper = requiredRole;

    // Define role hierarchy
    const roleHierarchy = {
      SUPER_ADMIN: 1,
      ADMIN: 2,
      MANAGER: 3,
      SUPERVISOR: 4,
      OPERATOR: 5,
      EMPLOYEE: 6,
      USER: 7,
    };

    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 7;
    const requiredRoleLevel = roleHierarchy[requiredRoleUpper as keyof typeof roleHierarchy] || 7;

    if (userRoleLevel > requiredRoleLevel) {
      return (
        <AccessDenied
          message={t('common.rbac.roleRequired', { role: requiredRole, currentRole: userRole })}
        />
      );
    }
  }

  // Check permission-based access
  if (requiredPermission && user) {
    // Strict check: if we require a permission, user must have it
    // Don't allow access if permissions haven't loaded yet (for security)
    if (!permissionsLoaded) {
      // Still loading permissions, show loading state
      return <RBACLoading message={t('common.rbac.loadingPermissions')} />;
    }
    
    if (!hasPermission(requiredPermission.action, requiredPermission.subject)) {
      return (
        <AccessDenied
          message={t('common.rbac.permissionDenied', { 
            action: requiredPermission.action, 
            subject: requiredPermission.subject 
          })}
        />
      );
    }
  }

  // Check route-based access
  if (requiredRoute && user) {
    if (!canAccessRoute(requiredRoute)) {
      return <AccessDenied message={t('common.rbac.routeAccessDenied')} />;
    }
  }

  return <>{children}</>;
}
