'use client';

import React from 'react';
import { useRBAC, usePermission, useRouteAccess } from './rbac-context';

// Component that renders children only if user has permission
interface CanProps {
  children: React.ReactNode;
  action: string;
  subject: string;
  fallback?: React.ReactNode;
}

export function Can({ children, action, subject, fallback }: CanProps) {
  const hasPermission = usePermission(action, subject);

  if (hasPermission) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that renders children only if user can access a route
interface CanAccessRouteProps {
  children: React.ReactNode;
  route: string;
  fallback?: React.ReactNode;
}

export function CanAccessRoute({ children, route, fallback }: CanAccessRouteProps) {
  const canAccess = useRouteAccess(route);

  if (canAccess) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that renders children only if user has any of the specified permissions
interface CanAnyProps {
  children: React.ReactNode;
  permissions: Array<{ action: string; subject: string }>;
  fallback?: React.ReactNode;
}

export function CanAny({ children, permissions, fallback }: CanAnyProps) {
  const { hasPermission } = useRBAC();

  const hasAnyPermission = permissions.some(({ action, subject }) =>
    hasPermission(action, subject)
  );

  if (hasAnyPermission) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that renders children only if user has all of the specified permissions
interface CanAllProps {
  children: React.ReactNode;
  permissions: Array<{ action: string; subject: string }>;
  fallback?: React.ReactNode;
}

export function CanAll({ children, permissions, fallback }: CanAllProps) {
  const { hasPermission } = useRBAC();

  const hasAllPermissions = permissions.every(({ action, subject }) =>
    hasPermission(action, subject)
  );

  if (hasAllPermissions) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that renders different content based on user's role
interface RoleBasedProps {
  children: React.ReactNode;
  roles: string[];
  fallback?: React.ReactNode;
}

export function RoleBased({ children, roles, fallback }: RoleBasedProps) {
  const { user } = useRBAC();

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  const hasRole = roles.some(role =>
    user.role?.toUpperCase() === role.toUpperCase()
  );

  if (hasRole) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that renders content based on user's role
interface RoleContentProps {
  children: React.ReactNode;
  role: string;
  fallback?: React.ReactNode;
}

export function RoleContent({ children, role, fallback }: RoleContentProps) {
  const { user } = useRBAC();

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  if (user.role?.toUpperCase() === role.toUpperCase()) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Component that shows access denied message
export function AccessDenied({
  message = "You don't have permission to access this resource.",
  className = "text-center p-4"
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-destructive mb-2">
        Access Denied
      </h3>
      <p className="text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

// Component that shows loading state
export function RBACLoading({
  message = "Checking permissions...",
  className = "text-center p-4"
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
