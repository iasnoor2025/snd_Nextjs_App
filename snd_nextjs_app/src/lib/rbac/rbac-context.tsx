'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  User, 
  UserRole, 
  Action, 
  Subject,
  hasPermission, 
  getAllowedActions, 
  canAccessRoute, 
  createUserFromSession 
} from './custom-rbac';

interface RBACContextType {
  user: User | null;
  hasPermission: (action: string, subject: string) => boolean;
  getAllowedActions: (subject: string) => string[];
  canAccessRoute: (route: string) => boolean;
  isLoading: boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: React.ReactNode;
}

export function RBACProvider({ children }: RBACProviderProps) {
  const { data: session, status } = useSession();

  // Debug logging removed as requested

  const user: User | null = useMemo(() => {
    // Handle loading state
    if (status === 'loading') {
      return null;
    }

    // Handle unauthenticated state
    if (!session?.user) {
      return null;
    }

    return createUserFromSession(session);
  }, [session, status]);

  const contextValue: RBACContextType = useMemo(() => ({
    user,
    hasPermission: (action: string, subject: string) => {
      if (!user) return false;
      return hasPermission(user, action as Action, subject as Subject);
    },
    getAllowedActions: (subject: string) => {
      if (!user) return [];
      return getAllowedActions(user, subject as Subject);
    },
    canAccessRoute: (route: string) => {
      if (!user) return false;
      return canAccessRoute(user, route);
    },
    isLoading: status === 'loading',
  }), [user, status]);

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
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
