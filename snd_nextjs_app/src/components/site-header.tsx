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

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* Only show sidebar trigger for non-employees */}
        {!isEmployee && (
          <>
            <SidebarTrigger className={isRTL ? '-mr-1' : '-ml-1'} />
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          </>
        )}
        <h1 className="text-base font-medium">{t('common.app.name')}</h1>
        <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center gap-2`}>
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
              >
                {currentUserRole}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {session?.user?.name || session?.user?.email}
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
                    <RefreshCw className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    <span>{t('common.actions.refreshSession')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    <span>{t('common.actions.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/profile" className="flex items-center">
                      <User className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                      <span>{t('common.actions.profile')}</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                    <LogOut className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
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
      </div>
    </header>
  );
}
