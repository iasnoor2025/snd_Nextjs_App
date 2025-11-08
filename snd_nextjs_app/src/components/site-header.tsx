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

export function SiteHeader() {
  const { data: session, status } = useSession();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  // Use RBAC context instead of fetching user role separately
  const { user, refreshPermissions } = useRBAC();
  const currentUserRole = user?.role || 'USER';

  // Check if user is an employee - use RBAC context role
  const isEmployee = currentUserRole === 'EMPLOYEE';

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
            variant={
              currentUserRole === 'SUPER_ADMIN'
                ? 'destructive'
                : currentUserRole === 'ADMIN'
                  ? 'default'
                  : currentUserRole === 'MANAGER'
                    ? 'secondary'
                    : currentUserRole === 'SUPERVISOR'
                      ? 'outline'
                    : currentUserRole === 'OPERATOR'
                      ? 'secondary'
                    : currentUserRole === 'EMPLOYEE'
                      ? 'default'
                      : 'secondary'
            }
            className="hidden sm:inline-flex text-xs"
          >
            {currentUserRole}
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
    <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b bg-background">
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
          {t('common.app.name')}
        </h1>
        
        {/* User controls - right in LTR, left in RTL */}
        <div className="flex items-center gap-1 sm:gap-2">
          <UserControls />
        </div>
      </div>
    </header>
  );
}
