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

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 RBAC - Status:', status);
    console.log('🔍 RBAC - Session:', session);
    console.log('🔍 RBAC - Session user:', session?.user);
  }

  const user: User | null = useMemo(() => {
    // Handle loading state
    if (status === 'loading') {
      return null;
    }

    // Handle unauthenticated state
    if (!session?.user) {
      return null;
    }

    let role = session.user.role || 'USER';

    // Remove hardcoded admin check - use proper role system
    // if (session.user.email === 'admin@ias.com') {
    //   role = 'SUPER_ADMIN';
    // }

    return {
      id: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || '',
      role: role,
      isActive: session.user.isActive || true,
      department: undefined, // Department will be fetched separately if needed
      permissions: undefined,
    };
  }, [session, status]);

  // Create ability for the user - only if user exists
  const ability = useMemo(() => {
    if (!user) {
      // Return a default ability for unauthenticated users
      return createAbilityFor({
        id: '',
        email: '',
        name: '',
        role: 'USER',
        isActive: false,
      });
    }
    
    return createAbilityFor({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive || true,
    });
  }, [user]);

  // Remove hardcoded admin check - use proper role system
  // if (session.user.email === 'admin@ias.com') {
  //   // Grant all permissions for admin
  //   return {
  //     user: session.user,
  //     hasPermission: () => true,
  //     getAllowedActions: () => ['all'],
  //     canAccessRoute: () => true,
  //   };
  // }

  const contextValue: RBACContextType = useMemo(() => {
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 RBAC - Creating context value');
      console.log('🔍 RBAC - User:', user);
      console.log('🔍 RBAC - Status:', status);
    }
    
    return {
      ability,
      user,
      hasPermission: (action: string, subject: string) => {
        try {
          if (!user) {
            return false;
          }
          const result = hasPermission(user, action as any, subject as any);
          return result;
        } catch (error) {
          console.error('🔍 RBAC - hasPermission error:', error);
          return false;
        }
      },
      getAllowedActions: (subject: string) => {
        try {
          if (!user) return [];
          const actions = getAllowedActions(user, subject as any);
          return actions;
        } catch (error) {
          console.error('🔍 RBAC - getAllowedActions error:', error);
          return [];
        }
      },
      canAccessRoute: (route: string) => {
        try {
          if (!user) return false;
          return canAccessRoute(user, route);
        } catch (error) {
          console.error('🔍 RBAC - canAccessRoute error:', error);
          return false;
        }
      },
      isLoading: status === 'loading',
    };
  }, [ability, user, status]);

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
