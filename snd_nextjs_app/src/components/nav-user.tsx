import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { LogOut, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import React from 'react';

export function NavUser() {
  const { session, status } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 rounded-full p-1 hover:bg-gray-100 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700 hidden md:block">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <User className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            <span>{t('common.actions.profile')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
          <span>{t('common.actions.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
