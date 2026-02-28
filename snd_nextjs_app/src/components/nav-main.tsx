'use client';

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/hooks/use-i18n';
import { memo } from 'react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type NavGroup = {
  labelKey: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    requiredRole?: string;
    requiredPermission?: { action: string; subject: string };
  }[];
};

export const NavMain = memo(function NavMain({
  groups,
}: {
  groups: NavGroup[];
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4 px-2">
      {groups.map(group => (
        <SidebarGroup key={group.labelKey} className="gap-1">
          <SidebarGroupLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {t(group.labelKey)}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {group.items.map(item => {
                const isDashboard = item.url.match(/^\/[a-z]{2}$/);
                const isActive = isDashboard
                  ? pathname === item.url
                  : pathname === item.url || pathname.startsWith(item.url + '/');

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        'rounded-lg px-3 py-2 transition-all duration-200 ease-out cursor-pointer',
                        'hover:bg-sidebar-accent/80 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2',
                        isActive && 'bg-emerald-600 text-white hover:bg-emerald-600/95 shadow-sm'
                      )}
                    >
                      <Link
                        href={item.url}
                        prefetch={true}
                        className={cn(
                          'relative flex items-center gap-3',
                          isActive && 'ps-1'
                        )}
                      >
                        {isActive && (
                          <span
                            className="absolute inset-y-0 start-0 w-1 rounded-e-full bg-white/30"
                            aria-hidden
                          />
                        )}
                        {item.icon && (
                          <item.icon className={cn('size-4 shrink-0', isActive && 'opacity-95')} />
                        )}
                        <span className="truncate text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  );
});
