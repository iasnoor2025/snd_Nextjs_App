'use client';

import React from 'react';
import { Action, Subject } from './custom-rbac';
import { usePermission, useRBAC, useRouteAccess } from './rbac-context';
import { useI18n } from '@/hooks/use-i18n';

// Component that shows content only if user has permission
interface PermissionContentProps {
  children: React.ReactNode;
  action: Action;
  subject: Subject;
  fallback?: React.ReactNode;
}

export function PermissionContent({ children, action, subject, fallback }: PermissionContentProps) {
  const { hasPermission } = usePermission();

  if (hasPermission(action, subject)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that shows content only if user can access a route
interface RouteContentProps {
  children: React.ReactNode;
  route: string;
  fallback?: React.ReactNode;
}

export function RouteContent({ children, route, fallback }: RouteContentProps) {
  const { canAccessRoute } = useRouteAccess();

  if (canAccessRoute(route)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that shows content only for specific roles
interface RoleContentProps {
  children: React.ReactNode;
  role: string;
  fallback?: React.ReactNode;
}

export function RoleContent({ children, role, fallback }: RoleContentProps) {
  const { user } = useRBAC();

  if (user?.role === role) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that shows content only for users with any of the specified roles
interface RoleBasedProps {
  children: React.ReactNode;
  roles: string[];
  fallback?: React.ReactNode;
}

export function RoleBased({ children, roles, fallback }: RoleBasedProps) {
  const { user } = useRBAC();

  if (user?.role && roles.includes(user.role)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that shows access denied message
export function AccessDenied({
  message,
  className = 'text-center p-4',
}: {
  message?: string;
  className?: string;
}) {
  const { t } = useI18n();
  
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-destructive mb-2">{t('common.rbac.accessDenied')}</h3>
      <p className="text-muted-foreground">{message || t('common.rbac.accessDeniedMessage')}</p>
    </div>
  );
}

// Component that shows loading state
export function RBACLoading({
  message,
  className = 'text-center p-4',
}: {
  message?: string;
  className?: string;
}) {
  const { t } = useI18n();
  
  return (
    <div className={className}>
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      <p className="text-muted-foreground mt-2">{message || t('common.rbac.checkingPermissions')}</p>
    </div>
  );
}
