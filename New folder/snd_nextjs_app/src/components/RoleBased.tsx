'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface RoleBasedProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleBased({ roles, children, fallback = null }: RoleBasedProps) {
  const { data: session } = useSession();

  // Check if user has the required role
  const hasRequiredRole = session?.user?.role && roles.includes(session.user.role);

  if (hasRequiredRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
