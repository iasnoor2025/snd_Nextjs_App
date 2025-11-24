'use client';

import { useSession } from 'next-auth/react';
import { PermissionContent } from '@/lib/rbac/rbac-components';

interface DocumentManagementPermissionProps {
  children: React.ReactNode;
  action?: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'upload' | 'download' | 'approve' | 'reject';
  fallback?: React.ReactNode;
}

export function DocumentManagementPermission({ 
  children, 
  action = 'read',
  fallback = null 
}: DocumentManagementPermissionProps) {
  const { data: session } = useSession();

  return (
    <PermissionContent
      action={action}
      subject="Document"
      fallback={fallback}
    >
      {children}
    </PermissionContent>
  );
}
