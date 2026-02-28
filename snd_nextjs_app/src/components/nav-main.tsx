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
    <div className="flex flex-col gap-5 px-2">
      {groups.map(group => (
        <SidebarGroup key={group.labelKey} className="gap-1.5">
          <SidebarGroupLabel className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/55">
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
                        'rounded-[var(--sidebar-radius)] px-3 py-2.5 transition-all duration-200 ease-out motion-reduce:transition-none cursor-pointer',
                        'hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                        isActive && 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] hover:bg-[hsl(var(--sidebar-primary))]/95 shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
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
                            className="absolute inset-y-0 start-0 w-1 rounded-e-full bg-white/25"
                            aria-hidden
                          />
                        )}
                        {item.icon && (
                          <item.icon className={cn('size-4 shrink-0', isActive && 'opacity-95')} />
                        )}
                        <span className="truncate text-sm font-medium">{item.title}</span>
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
