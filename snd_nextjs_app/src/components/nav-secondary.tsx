'use client';

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
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
                  className={isActive ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Link href={item.url}>
                    <item.icon />
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
