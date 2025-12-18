'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTranslation } from 'react-i18next';
import { LogOut, RefreshCw, Settings, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { I18nErrorBoundary } from './i18n-error-boundary';
import { LanguageSwitcher } from './language-switcher';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useSettings } from '@/hooks/use-settings';

export function SiteHeader() {
  const { data: session, status } = useSession();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  // Use RBAC context instead of fetching user role separately
  const { user, refreshPermissions } = useRBAC();
  const currentUserRole = user?.role || 'USER';
  const [roleDisplayName, setRoleDisplayName] = useState<string>(currentUserRole);
  const [roleColor, setRoleColor] = useState<string | null>(null);
  const [userPreferredColor, setUserPreferredColor] = useState<string | null>(null);
  const { getSetting } = useSettings(['app.name']);
  const appName = getSetting('app.name', t('common.app.name'));

  // Check if user is an employee - use RBAC context role
  const isEmployee = currentUserRole === 'EMPLOYEE';

  // Map color name to Tailwind classes
  const getColorClasses = (colorName: string | null | undefined, type: 'header' | 'badge' = 'header') => {
    if (!colorName) return null;

    const colorMap: Record<string, { header: string; badge: string }> = {
      'red': {
        header: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
        badge: 'bg-red-600 text-white border-red-700'
      },
      'blue': {
        header: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-600 text-white border-blue-700'
      },
      'purple': {
        header: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
        badge: 'bg-purple-600 text-white border-purple-700'
      },
      'orange': {
        header: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
        badge: 'bg-orange-100 text-orange-800 border-orange-300'
      },
      'green': {
        header: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
        badge: 'bg-green-100 text-green-800 border-green-300'
      },
      'gray': {
        header: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800',
        badge: 'bg-gray-100 text-gray-800 border-gray-300'
      },
      'slate': {
        header: 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800',
        badge: 'bg-slate-100 text-slate-700 border-slate-300'
      },
      'indigo': {
        header: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      },
      'teal': {
        header: 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800',
        badge: 'bg-teal-100 text-teal-800 border-teal-300'
      },
      'pink': {
        header: 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800',
        badge: 'bg-pink-100 text-pink-800 border-pink-300'
      },
      'cyan': {
        header: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-300'
      },
      'amber': {
        header: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-800 border-amber-300'
      },
      'emerald': {
        header: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      },
      'violet': {
        header: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800',
        badge: 'bg-violet-100 text-violet-800 border-violet-300'
      },
      'rose': {
        header: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
        badge: 'bg-rose-100 text-rose-800 border-rose-300'
      },
    };

    const normalizedColor = colorName.toLowerCase();
    return colorMap[normalizedColor]?.[type] || null;
  };

  // Get badge color and variant based on role
  const getRoleBadgeStyle = (role: string) => {
    const roleUpper = role.toUpperCase();
    
    // Use a hash-like function to assign consistent colors based on role name
    // This ensures the same role always gets the same color
    const roleColors: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      'SUPER_ADMIN': { variant: 'destructive', className: 'bg-red-600 text-white border-red-700' },
      'ADMIN': { variant: 'default', className: 'bg-blue-600 text-white border-blue-700' },
      'MANAGER': { variant: 'default', className: 'bg-purple-600 text-white border-purple-700' },
      'SUPERVISOR': { variant: 'outline', className: 'bg-orange-100 text-orange-800 border-orange-300' },
      'OPERATOR': { variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-300' },
      'EMPLOYEE': { variant: 'default', className: 'bg-gray-100 text-gray-800 border-gray-300' },
      'USER': { variant: 'outline', className: 'bg-slate-100 text-slate-700 border-slate-300' },
    };

    // Check for exact match first
    if (roleColors[roleUpper]) {
      return roleColors[roleUpper];
    }

    // For custom roles (like "workshop"), assign colors based on role name hash
    // This ensures consistent colors for the same role
    const roleHash = role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorOptions = [
      { variant: 'default' as const, className: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
      { variant: 'default' as const, className: 'bg-teal-100 text-teal-800 border-teal-300' },
      { variant: 'default' as const, className: 'bg-pink-100 text-pink-800 border-pink-300' },
      { variant: 'default' as const, className: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
      { variant: 'default' as const, className: 'bg-amber-100 text-amber-800 border-amber-300' },
      { variant: 'default' as const, className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      { variant: 'default' as const, className: 'bg-violet-100 text-violet-800 border-violet-300' },
      { variant: 'default' as const, className: 'bg-rose-100 text-rose-800 border-rose-300' },
    ];
    
    const selectedColor = colorOptions[roleHash % colorOptions.length];
    return selectedColor;
  };

  // Get header background color based on role (with database color support and user preference)
  const getHeaderColor = (role: string, roleColor?: string | null, userPreferredColor?: string | null) => {
    // First, check if user has a preferred color (highest priority)
    if (userPreferredColor) {
      const userColor = getColorClasses(userPreferredColor, 'header');
      if (userColor) return userColor;
    }
    
    // Second, try to use color from database (role color)
    if (roleColor) {
      const dbColor = getColorClasses(roleColor, 'header');
      if (dbColor) return dbColor;
    }

    // Fallback to hardcoded colors for known roles
    const roleUpper = role.toUpperCase();
    const roleHeaderColors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
      'ADMIN': 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
      'MANAGER': 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
      'SUPERVISOR': 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
      'OPERATOR': 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
      'EMPLOYEE': 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800',
      'USER': 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800',
    };

    if (roleHeaderColors[roleUpper]) {
      return roleHeaderColors[roleUpper];
    }

    // For custom roles without color, use hash-based auto-assignment
    const roleHash = role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorOptions = [
      'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800',
      'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800',
      'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800',
      'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800',
      'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
      'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
      'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800',
      'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
    ];
    
    return colorOptions[roleHash % colorOptions.length];
  };

  // Get badge style with database color support
  const getRoleBadgeStyleWithColor = (role: string, roleColor?: string | null) => {
    // First, try to use color from database
    if (roleColor) {
      const dbColor = getColorClasses(roleColor, 'badge');
      if (dbColor) {
        return { variant: 'default' as const, className: dbColor };
      }
    }
    // Fallback to original function
    return getRoleBadgeStyle(role);
  };

  // Calculate badge style and header color using current state (with user preference)
  const badgeStyle = getRoleBadgeStyleWithColor(roleDisplayName, roleColor);
  const headerColorClass = getHeaderColor(roleDisplayName, roleColor, userPreferredColor);

  // Fetch role name and color from database
  useEffect(() => {
    const fetchRoleName = async () => {
      if (!user?.id) {
        return;
      }

      try {
        // First, get the user's actual role from the database via /api/auth/me
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const actualRole = userData.user?.role;
          const preferredColor = userData.user?.preferredColor;
          
          // Set user preferred color (can be null/empty/undefined to use role color)
          setUserPreferredColor(preferredColor || null);
          
          if (actualRole) {
            // Now fetch all roles to get the original casing and color
            const rolesResponse = await fetch('/api/roles');
            if (rolesResponse.ok) {
              const roles = await rolesResponse.json();
              // Find role by name (case-insensitive)
              const role = roles.find((r: { name: string }) => 
                r.name.toUpperCase() === actualRole.toUpperCase()
              );
              if (role?.name) {
                // Use the actual role name from database (preserves original casing like "workshop")
                setRoleDisplayName(role.name);
                // Set role color from database if available
                if (role.color) {
                  setRoleColor(role.color);
                }
                return;
              }
            }
            
            // If role not found in roles list, format the role name nicely
            setRoleDisplayName(
              actualRole
                .split('_')
                .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                .join(' ')
            );
          } else {
            // Fallback to current role
            setRoleDisplayName(currentUserRole);
          }
        } else {
          // Fallback: try to find role in roles list using currentUserRole
          const rolesResponse = await fetch('/api/roles');
          if (rolesResponse.ok) {
            const roles = await rolesResponse.json();
            const role = roles.find((r: { name: string }) => 
              r.name.toUpperCase() === currentUserRole.toUpperCase()
            );
            if (role?.name) {
              setRoleDisplayName(role.name);
            } else {
              setRoleDisplayName(currentUserRole);
            }
          } else {
            setRoleDisplayName(currentUserRole);
          }
        }
      } catch (error) {
        // Fallback to current role on error
        setRoleDisplayName(currentUserRole);
      }
    };

    fetchRoleName();
  }, [user?.id, currentUserRole]);

  // Refresh session using RBAC context
  const refreshSession = async () => {
    await refreshPermissions();
  };

  // User controls component (reusable)
  const UserControls = () => (
    <div className="flex items-center gap-1 sm:gap-2">
      <I18nErrorBoundary>
        <LanguageSwitcher />
      </I18nErrorBoundary>
      {status === 'loading' ? (
        <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
      ) : session ? (
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshSession}
            title={t('common.actions.refreshSession')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Badge
            variant={badgeStyle.variant}
            className={cn(
              "hidden sm:inline-flex text-xs font-medium",
              badgeStyle.className
            )}
          >
            {roleDisplayName}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline truncate max-w-[120px] md:max-w-none">
                  {session?.user?.name || session?.user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={refreshSession}>
                <RefreshCw className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
                <span>{t('common.actions.refreshSession')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
                <span>{t('common.actions.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/profile" className="flex items-center">
                  <User className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
                  <span>{t('common.actions.profile')}</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
                <span>{t('common.actions.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="/login">{t('common.signIn')}</a>
          </Button>
          <ThemeToggle />
        </div>
      )}
    </div>
  );

  return (
    <header className={cn(
      "flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b transition-colors duration-200",
      headerColorClass
    )}>
      <div className={cn(
        "flex w-full items-center gap-1 px-2 sm:px-4 lg:gap-2 lg:px-6",
        isRTL && "flex-row-reverse"
      )}>
        {/* Sidebar trigger - left in LTR, right in RTL */}
        {!isEmployee && (
          <>
            <SidebarTrigger className={cn(
              isRTL ? '-mr-1' : '-ml-1',
              'size-6 sm:size-7'
            )} />
            <Separator 
              orientation="vertical" 
              className="mx-1 sm:mx-2 data-[orientation=vertical]:h-4"
            />
          </>
        )}
        
        {/* Title - grows to fill space */}
        <h1 className="text-sm sm:text-base font-medium truncate flex-1">
          {appName}
        </h1>
        
        {/* User controls - right in LTR, left in RTL */}
        <div className="flex items-center gap-1 sm:gap-2">
          <UserControls />
        </div>
      </div>
    </header>
  );
}
