'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { AccessDenied, RBACLoading } from '@/lib/rbac/rbac-components';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'USER';
  requiredPermission?: { action: string; subject: string };
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
  const { data: session, status } = useSession();
  const { user, isLoading, hasPermission, canAccessRoute } = useRBAC();
  const router = useRouter();

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
    const userRole = user.role?.toUpperCase();
    const requiredRoleUpper = requiredRole.toUpperCase();

    // Define role hierarchy
    const roleHierarchy = {
      'SUPER_ADMIN': 6,
      'ADMIN': 5,
      'MANAGER': 4,
      'SUPERVISOR': 3,
      'OPERATOR': 2,
      'USER': 1,
    };

    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRoleUpper as keyof typeof roleHierarchy] || 0;

    if (userRoleLevel < requiredRoleLevel) {
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
