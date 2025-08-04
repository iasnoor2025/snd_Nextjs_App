'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { AccessDenied, RBACLoading } from '@/lib/rbac/rbac-components';
import { UserRole, Action, Subject } from '@/lib/rbac/custom-rbac';

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
  fallback
}: ProtectedRouteProps) {
  
  const { user, isLoading, hasPermission, canAccessRoute } = useRBAC();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      toast.error('Please sign in to access this page');
      router.push('/login');
    }
  }, [session, status, router]);

  // Show loading while checking authentication and permissions
  if (status === 'loading' || isLoading) {
    return <RBACLoading />;
  }

  // Check authentication
  if (!session) {
    return fallback || <RBACLoading message="Redirecting to sign in..." />;
  }

  // Check role-based access
  if (requiredRole && user) {
    const userRole = user.role;
    const requiredRoleUpper = requiredRole;

    // Define role hierarchy
    const roleHierarchy = {
      'SUPER_ADMIN': 1,
      'ADMIN': 2,
      'MANAGER': 3,
      'SUPERVISOR': 4,
      'OPERATOR': 5,
      'EMPLOYEE': 6,
      'USER': 7,
    };

    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 7;
    const requiredRoleLevel = roleHierarchy[requiredRoleUpper as keyof typeof roleHierarchy] || 7;

    if (userRoleLevel > requiredRoleLevel) {
      return (
        <AccessDenied
          message={`This page requires ${requiredRole} role or higher. Your current role is ${userRole}.`}
        />
      );
    }
  }

  // Check permission-based access
  if (requiredPermission && user) {
    if (!hasPermission(requiredPermission.action, requiredPermission.subject)) {
      return (
        <AccessDenied
          message={`You don't have permission to ${requiredPermission.action} ${requiredPermission.subject}.`}
        />
      );
    }
  }

  // Check route-based access
  if (requiredRoute && user) {
    if (!canAccessRoute(requiredRoute)) {
      return (
        <AccessDenied
          message={`You don't have permission to access this route.`}
        />
      );
    }
  }

  return <>{children}</>;
}
