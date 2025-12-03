'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { useRBAC } from '@/lib/rbac/rbac-context';

interface PermissionBasedProps {
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import' | 'sync' | 'reset';
  subject: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionBased({ action, subject, children, fallback = null }: PermissionBasedProps) {
  const { data: session } = useSession();
  const { hasPermission } = useRBAC();

  // Check if user has the required permission
  const hasPermissionResult = hasPermission(action, subject);

  if (hasPermissionResult) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
