'use client';

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/hooks/use-i18n';
import { memo } from 'react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export const NavMain = memo(function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    requiredRole?: string;
    requiredPermission?: { action: string; subject: string };
  }[];
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map(item => {
            // Calculate active state
            const isDashboard = item.url.match(/^\/[a-z]{2}$/);
            const isActive = isDashboard 
              ? pathname === item.url 
              : pathname === item.url || pathname.startsWith(item.url + '/');
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={isActive ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Link href={item.url} prefetch={true}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});
