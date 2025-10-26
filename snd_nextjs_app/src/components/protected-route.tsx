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

  // Track when permissions are loaded
  useEffect(() => {
    if (user && !isLoading) {
      // Wait a bit for permissions to load from API
      const timer = setTimeout(() => {
        setPermissionsLoaded(true);
      }, 500);
      return () => clearTimeout(timer);
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
