'use client';
import { NavDocuments } from '@/components/nav-documents';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  BarChart3,
  Building,
  Calendar,
  Database,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  LayoutDashboard,
  MapPin,
  Search,
  Settings,
  User,
  Users,
  Wrench,

  Car,
} from 'lucide-react';
import * as React from 'react';
// import { NotificationBell } from "@/components/notification-bell"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useI18n } from '@/hooks/use-i18n';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { useTranslation } from 'react-i18next';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isRTL } = useI18n();
  const { t } = useTranslation('sidebar');
  const { canAccessRoute, user, hasPermission } = useRBAC();


  // Debug logging removed for cleaner console

  // Define all possible menu items with their routes
  const allMenuItems = [
    {
      title: t('dashboard'),
      icon: LayoutDashboard,
      url: '/',
    },
    {
      title: t('employeeDashboard'),
      url: '/employee-dashboard',
      icon: User,
    },
    {
      title: t('customerManagement'),
      url: '/modules/customer-management',
      icon: Users,
    },
    {
      title: t('companyManagement'),
      url: '/modules/company-management',
      icon: Building,
    },
    {
      title: t('employeeManagement'),
      url: '/modules/employee-management',
      icon: Users,
    },

    {
      title: t('equipmentManagement'),
      url: '/modules/equipment-management',
      icon: Car,
    },
    {
      title: t('maintenanceManagement'),
      url: '/modules/maintenance-management',
      icon: Wrench,
    },
    {
      title: t('rentalManagement'),
      url: '/modules/rental-management',
      icon: Calendar,
    },
    {
      title: t('quotationManagement'),
      url: '/modules/quotation-management',
      icon: FileText,
    },
    {
      title: t('timesheetManagement'),
      url: '/modules/timesheet-management',
      icon: Calendar,
    },
    {
      title: t('projectManagement'),
      url: '/modules/project-management',
      icon: FileText,
    },
    {
      title: t('payrollManagement'),
      url: '/modules/payroll-management',
      icon: BarChart3,
    },
    {
      title: t('salaryIncrements'),
      url: '/modules/salary-increments',
      icon: BarChart3,
    },
    {
      title: t('leaveManagement'),
      url: '/modules/leave-management',
      icon: Calendar,
    },
    {
      title: t('safetyManagement'),
      url: '/modules/safety-management',
      icon: HelpCircle,
    },
    {
      title: t('locationManagement'),
      url: '/modules/location-management',
      icon: MapPin,
    },
    {
      title: t('reporting'),
      url: '/modules/reporting',
      icon: FileSpreadsheet,
    },
    {
      title: t('documentManagement'),
      url: '/modules/document-management',
      icon: FileText,
    },
    {
      title: t('userManagement'),
      url: '/modules/user-management',
      icon: Users,
    },
  ];

  const allSecondaryItems = [
    {
      title: t('settings'),
      url: '/modules/settings',
      icon: Settings,
    },
    {
      title: t('getHelp'),
      url: '#',
      icon: HelpCircle,
    },
    {
      title: t('search'),
      url: '#',
      icon: Search,
    },
  ];

  const allDocumentItems: Array<{
    name: string;
    url: string;
    icon: any;
  }> = [
  ];

  // Filter menu items based on user permissions
  const filterMenuItems = (items: any[]) => {
    if (!user) return [];

    // Debug logging for permission checking
    // Filtering sidebar items
    
    // Always show items without specific routes (like help, search)
    const essentialItems = items.filter(item => item.url === '#' || !item.url);
    
    // Filter route-based items by permissions
    const routeItems = items.filter(item => {
      // Skip essential items (already handled above)
      if (item.url === '#' || !item.url) return false;
      
      // Hide employee dashboard for non-EMPLOYEE users
      if (item.url === '/employee-dashboard') {
        const hasEmployeePermission = hasPermission('read', 'mydashboard');  
        // Employee Dashboard permission check
        return hasEmployeePermission;
      }
      
      // For all other routes, check if user can access them
      const canAccess = canAccessRoute(item.url);
              // Route access check
      return canAccess;
    });
    
    const result = [...essentialItems, ...routeItems];
    // Sidebar items filtered
    
    return result;
  };

  // Filter menu items based on permissions
  const navMain = filterMenuItems(allMenuItems);
  const navSecondary = filterMenuItems(allSecondaryItems);
  const documents = filterMenuItems(allDocumentItems);

  const data = {
    navMain,
    navSecondary,
    documents,
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="sidebar"
      side={isRTL ? 'right' : 'left'}
      className="w-64"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <Layers className="!size-5" />
                <span className="text-base font-semibold">{t('appTitle')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
