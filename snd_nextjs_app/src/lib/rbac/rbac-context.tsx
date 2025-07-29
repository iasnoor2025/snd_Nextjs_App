'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { createAbilityFor, AppAbility, User, hasPermission, getAllowedActions, canAccessRoute } from './abilities';

interface RBACContextType {
  ability: AppAbility;
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

  const user: User | null = useMemo(() => {
    if (!session?.user) return null;

    return {
      id: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || '',
      role: session.user.role || 'USER',
      isActive: session.user.isActive || true,
      department: undefined, // Department will be fetched separately if needed
      permissions: undefined,
    };
  }, [session]);

  const ability = useMemo(() => {
    if (!user) {
      return createAbilityFor({
        id: '',
        email: '',
        name: '',
        role: 'USER',
        isActive: false,
      });
    }
    return createAbilityFor(user);
  }, [user]);

  const contextValue: RBACContextType = useMemo(() => ({
    ability,
    user,
    hasPermission: (action: string, subject: string) => {
      if (!user) return false;
      return hasPermission(user, action as any, subject as any);
    },
    getAllowedActions: (subject: string) => {
      if (!user) return [];
      return getAllowedActions(user, subject as any);
    },
    canAccessRoute: (route: string) => {
      if (!user) return false;
      return canAccessRoute(user, route);
    },
    isLoading: status === 'loading',
  }), [ability, user, status]);

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

// Hook for checking specific permissions
export function usePermission(action: string, subject: string) {
  const { hasPermission } = useRBAC();
  return hasPermission(action, subject);
}

// Hook for checking route access
export function useRouteAccess(route: string) {
  const { canAccessRoute } = useRBAC();
  return canAccessRoute(route);
}

// Hook for getting allowed actions for a subject
export function useAllowedActions(subject: string) {
  const { getAllowedActions } = useRBAC();
  return getAllowedActions(subject);
}
