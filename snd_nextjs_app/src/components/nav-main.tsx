'use client';

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/hooks/use-i18n';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">

        <SidebarMenu>
          {items.map(item => {
            // Special handling for dashboard to avoid conflicts with other routes
            let isActive = false;
            
            // Check if this is the dashboard item (URL is just locale like /en or /ar)
            const isDashboard = item.url.match(/^\/[a-z]{2}$/);
            
            if (isDashboard) {
              // Dashboard case - only match exact locale path
              isActive = pathname === item.url;
            } else {
              // Other routes - match exact or starts with
              isActive = pathname === item.url || pathname.startsWith(item.url + '/');
            }
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={isActive ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Link href={item.url}>
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
}
