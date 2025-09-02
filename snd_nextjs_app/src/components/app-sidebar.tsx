'use client';
import { NavDocuments } from '@/components/nav-documents';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  BarChart3,
  Building,
  Calendar,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  LayoutDashboard,
  MapPin,
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
import { validateLocale } from '@/lib/locale-utils';
import { useParams } from 'next/navigation';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t, isRTL } = useI18n();
  const { canAccessRoute, user, hasPermission } = useRBAC();
  const params = useParams();
  const [locale, setLocale] = React.useState('en');

  React.useEffect(() => {
    const currentLocale = validateLocale(params?.locale as string);
    setLocale(currentLocale);
  }, [params?.locale]);


  // Debug logging removed for cleaner console

  // Define all possible menu items with their routes
  const allMenuItems = [
    {
      title: t('sidebar.dashboard'),
      icon: LayoutDashboard,
      url: `/${locale}`,
    },
    {
      title: t('sidebar.employeeDashboard'),
      url: '/employee-dashboard',
      icon: User,
    },
    {
      title: t('sidebar.customerManagement'),
      url: '/modules/customer-management',
      icon: Users,
    },
    {
      title: t('sidebar.companyManagement'),
      url: '/modules/company-management',
      icon: Building,
    },
    {
      title: t('sidebar.employeeManagement'),
      url: '/modules/employee-management',
      icon: Users,
    },

    {
      title: t('sidebar.equipmentManagement'),
      url: '/modules/equipment-management',
      icon: Car,
    },
    {
      title: t('sidebar.maintenanceManagement'),
      url: '/modules/maintenance-management',
      icon: Wrench,
    },
    {
      title: t('sidebar.rentalManagement'),
      url: '/modules/rental-management',
      icon: Calendar,
    },
    {
      title: t('sidebar.quotationManagement'),
      url: '/modules/quotation-management',
      icon: FileText,
    },
    {
      title: t('sidebar.timesheetManagement'),
      url: '/modules/timesheet-management',
      icon: Calendar,
    },
    {
      title: t('sidebar.projectManagement'),
      url: '/modules/project-management',
      icon: FileText,
    },
    {
      title: t('sidebar.payrollManagement'),
      url: '/modules/payroll-management',
      icon: BarChart3,
    },
    {
      title: t('sidebar.salaryIncrements'),
      url: '/modules/salary-increments',
      icon: BarChart3,
    },
    {
      title: t('sidebar.leaveManagement'),
      url: '/modules/leave-management',
      icon: Calendar,
    },
    {
      title: t('sidebar.safetyManagement'),
      url: '/modules/safety-management',
      icon: HelpCircle,
    },
    {
      title: t('sidebar.locationManagement'),
      url: '/modules/location-management',
      icon: MapPin,
    },
    {
      title: t('sidebar.reporting'),
      url: '/modules/reporting',
      icon: FileSpreadsheet,
    },
    {
      title: t('sidebar.documentManagement'),
      url: '/modules/document-management',
      icon: FileText,
    },
    {
      title: t('sidebar.userManagement'),
      url: '/modules/user-management',
      icon: Users,
    },
  ];

  // const allSecondaryItems = [


  //   {
  //     title: t('getHelp'),
  //     url: '#',
  //     icon: HelpCircle,
  //   },
  //   {
  //     title: t('search'),
  //     url: '#',
  //     icon: Search,
  //   },
  // ];

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
  // const navSecondary = filterMenuItems(allSecondaryItems);
  const documents = filterMenuItems(allDocumentItems);

  const data = {
    navMain,
    // navSecondary,
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
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
