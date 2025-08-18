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
  const { canAccessRoute, user } = useRBAC();

  // Define all possible menu items with their routes
  const allMenuItems = [
    {
      title: t('dashboard'),
      url: '/dashboard',
      icon: LayoutDashboard,
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
      icon: Wrench,
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

  const allDocumentItems = [
    {
      name: t('analytics'),
      url: '/modules/analytics',
      icon: BarChart3,
    },
    {
      name: t('auditCompliance'),
      url: '/modules/audit-compliance',
      icon: Database,
    },
  ];

  // Filter menu items based on user permissions
  const filterMenuItems = (items: any[]) => {
    if (!user) return [];

    // For EMPLOYEE role, only show employee dashboard and essential items
    if (user.role === 'EMPLOYEE') {
      return items.filter(item => {
        // Always show items without specific routes (like help, search)
        if (item.url === '#' || !item.url) return true;

        // For employees, only show employee dashboard and settings
        if (item.url === '/employee-dashboard' || item.url === '/modules/settings') {
          return true;
        }

        return false;
      });
    }

    // For other roles, use normal permission filtering but exclude employee dashboard
    return items.filter(item => {
      // Always show items without specific routes (like help, search)
      if (item.url === '#' || !item.url) return true;

      // Hide employee dashboard for non-EMPLOYEE roles
      if (item.url === '/employee-dashboard') {
        return false;
      }

      // Check if user can access this route
      return canAccessRoute(item.url);
    });
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
