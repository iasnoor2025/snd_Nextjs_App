'use client';
import { NavDocuments } from '@/components/nav-documents';
import { NavMain } from '@/components/nav-main';
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
  User,
  Users,
  Wrench,
  Car,
  type LucideIcon,
} from 'lucide-react';
import * as React from 'react';
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

// Define menu item type
type MenuItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  requiredRole?: string;
  requiredPermission?: { action: string; subject: string };
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t, isRTL } = useI18n();
  const { canAccessRoute, user, hasPermission } = useRBAC();
  const params = useParams();
  const [locale, setLocale] = React.useState('en');

  React.useEffect(() => {
    const currentLocale = validateLocale(params?.locale as string);
    setLocale(currentLocale);
  }, [params?.locale]);

  // Memoize menu items definition to prevent recreation
  const allMenuItems = React.useMemo<MenuItem[]>(() => [
    {
      title: t('sidebar.dashboard'),
      icon: LayoutDashboard,
      url: `/${locale}`,
    },
    {
      title: t('sidebar.employeeDashboard'),
      url: `/${locale}/employee-dashboard`,
      icon: User,
    },
    {
      title: t('sidebar.customerManagement'),
      url: `/${locale}/modules/customer-management`,
      icon: Users,
    },
    {
      title: t('sidebar.companyManagement'),
      url: `/${locale}/modules/company-management`,
      icon: Building,
    },
    {
      title: t('sidebar.employeeManagement'),
      url: `/${locale}/modules/employee-management`,
      icon: Users,
    },
    {
      title: t('sidebar.equipmentManagement'),
      url: `/${locale}/modules/equipment-management`,
      icon: Car,
    },
    {
      title: t('sidebar.maintenanceManagement'),
      url: `/${locale}/modules/maintenance-management`,
      icon: Wrench,
    },
    {
      title: t('sidebar.rentalManagement'),
      url: `/${locale}/modules/rental-management`,
      icon: Calendar,
    },
    {
      title: t('sidebar.quotationManagement'),
      url: `/${locale}/modules/quotation-management`,
      icon: FileText,
    },
    {
      title: t('sidebar.timesheetManagement'),
      url: `/${locale}/modules/timesheet-management`,
      icon: Calendar,
    },
    {
      title: t('sidebar.projectManagement'),
      url: `/${locale}/modules/project-management`,
      icon: FileText,
    },
    {
      title: t('sidebar.payrollManagement'),
      url: `/${locale}/modules/payroll-management`,
      icon: BarChart3,
    },
    {
      title: t('sidebar.salaryIncrements'),
      url: `/${locale}/modules/salary-increments`,
      icon: BarChart3,
    },
    {
      title: t('sidebar.leaveManagement'),
      url: `/${locale}/modules/leave-management`,
      icon: Calendar,
    },
    {
      title: t('sidebar.safetyManagement'),
      url: `/${locale}/modules/safety-management`,
      icon: HelpCircle,
    },
    {
      title: t('sidebar.locationManagement'),
      url: `/${locale}/modules/location-management`,
      icon: MapPin,
    },
    {
      title: t('sidebar.reporting'),
      url: `/${locale}/modules/reporting`,
      icon: FileSpreadsheet,
    },
    {
      title: t('sidebar.documentManagement'),
      url: `/${locale}/modules/document-management`,
      icon: FileText,
    },
    {
      title: t('sidebar.userManagement'),
      url: `/${locale}/modules/user-management`,
      icon: Users,
    },
    {
      title: t('sidebar.databaseBackup'),
      url: `/${locale}/admin/backup`,
      icon: Database,
      requiredPermission: { action: 'manage', subject: 'all' }
    },
  ], [t, locale]);

  const allDocumentItems: MenuItem[] = React.useMemo(() => [], []);

  // Memoize filter function to prevent recreation
  const filterMenuItems = React.useCallback((items: MenuItem[]) => {
    if (!user) return [];

    // Always show items without specific routes (like help, search)
    const essentialItems = items.filter(item => item.url === '#' || !item.url);
    
    // Filter route-based items by permissions
    const routeItems = items.filter(item => {
      // Skip essential items (already handled above)
      if (item.url === '#' || !item.url) return false;
      
      // Check for specific permission requirements first
      if (item.requiredPermission) {
        return hasPermission(item.requiredPermission.action, item.requiredPermission.subject);
      }
      
      // Hide employee dashboard for non-EMPLOYEE users
      if (item.url === `/${locale}/employee-dashboard`) {
        return hasPermission('read', 'mydashboard');
      }
      
      // For all other routes, check if user can access them
      const routeWithoutLocale = item.url.replace(`/${locale}`, '');
      return canAccessRoute(routeWithoutLocale);
    });
    
    return [...essentialItems, ...routeItems];
  }, [user, locale, hasPermission, canAccessRoute]);

  // Memoize filtered menu items to prevent recalculation on every render
  const navMain = React.useMemo(() => filterMenuItems(allMenuItems), [filterMenuItems, allMenuItems]);
  const documents = React.useMemo(() => filterMenuItems(allDocumentItems), [filterMenuItems, allDocumentItems]);

  const data = React.useMemo(() => ({
    navMain,
    documents,
  }), [navMain, documents]);

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
                <span className="text-base font-semibold">{t('sidebar.appTitle')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
