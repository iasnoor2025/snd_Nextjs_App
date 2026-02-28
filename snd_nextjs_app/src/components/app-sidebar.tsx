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
  MessageSquare,
  User,
  Users,
  Wrench,
  Car,
  Settings,
  Wallet,
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
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSettings } from '@/hooks/use-settings';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getRoleColorByRoleName } from '@/lib/utils/role-colors';

// Define menu item type
type MenuItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  requiredRole?: string;
  requiredPermission?: { action: string; subject: string };
};

// Navigation groups for better organization
type NavGroup = {
  labelKey: string;
  items: MenuItem[];
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t, isRTL } = useI18n();
  const { canAccessRoute, user, hasPermission } = useRBAC();
  const params = useParams();
  const [locale, setLocale] = React.useState('en');
  const [roleColor, setRoleColor] = useState<string | null>(null);
  const [userPreferredColor, setUserPreferredColor] = useState<string | null>(null);
  const { getSetting } = useSettings(['company.name', 'company.logo', 'app.name']);
  const appTitle = getSetting('company.name') || getSetting('app.name') || t('sidebar.appTitle');
  const companyLogo = getSetting('company.logo') || '/snd-logo.png';
  const currentUserRole = user?.role || 'USER';

  // Fetch role color and user preferred color from database
  useEffect(() => {
    const fetchColorInfo = async () => {
      if (!user?.role) {
        return;
      }

      try {
        // Fetch user info to get preferred color
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user?.preferredColor) {
            setUserPreferredColor(userData.user.preferredColor);
          }
        }

        // Fetch role color
        const rolesResponse = await fetch('/api/roles');
        if (rolesResponse.ok) {
          const roles = await rolesResponse.json();
          const role = roles.find((r: { name: string }) => 
            r.name.toUpperCase() === (user.role as string).toUpperCase()
          );
          if (role?.color) {
            setRoleColor(role.color);
          }
        }
      } catch (error) {
        console.error('Error fetching color info:', error);
      }
    };

    fetchColorInfo();
  }, [user?.role]);

  React.useEffect(() => {
    const currentLocale = validateLocale(params?.locale as string);
    setLocale(currentLocale);
  }, [params?.locale]);

  // Memoize menu items definition with logical groups
  const allNavGroups = React.useMemo<NavGroup[]>(() => [
    {
      labelKey: 'sidebar.groupOverview',
      items: [
        { title: t('sidebar.dashboard'), icon: LayoutDashboard, url: `/${locale}` },
        { title: t('sidebar.employeeDashboard'), url: `/${locale}/employee-dashboard`, icon: User },
      ],
    },
    {
      labelKey: 'sidebar.groupManagement',
      items: [
        { title: t('sidebar.customerManagement'), url: `/${locale}/customer-management`, icon: Users },
        { title: t('sidebar.companyManagement'), url: `/${locale}/company-management`, icon: Building },
        { title: t('sidebar.employeeManagement'), url: `/${locale}/employee-management`, icon: Users },
        { title: t('sidebar.equipmentManagement'), url: `/${locale}/equipment-management`, icon: Car },
        { title: t('sidebar.maintenanceManagement'), url: `/${locale}/maintenance-management`, icon: Wrench },
      ],
    },
    {
      labelKey: 'sidebar.groupOperations',
      items: [
        { title: t('sidebar.rentalManagement'), url: `/${locale}/rental-management`, icon: Calendar },
        { title: t('sidebar.quotationManagement'), url: `/${locale}/quotation-management`, icon: FileText },
        { title: t('sidebar.timesheetManagement'), url: `/${locale}/timesheet-management`, icon: Calendar },
        { title: t('sidebar.projectManagement'), url: `/${locale}/project-management`, icon: FileText },
      ],
    },
    {
      labelKey: 'sidebar.groupFinance',
      items: [
        { title: t('sidebar.payrollManagement'), url: `/${locale}/payroll-management`, icon: BarChart3 },
        { title: t('sidebar.pettyCashManagement'), url: `/${locale}/finance/petty-cash`, icon: Wallet },
        { title: t('sidebar.salaryIncrements'), url: `/${locale}/salary-increments`, icon: BarChart3 },
      ],
    },
    {
      labelKey: 'sidebar.groupHR',
      items: [
        { title: t('sidebar.leaveManagement'), url: `/${locale}/leave-management`, icon: Calendar },
      ],
    },
    {
      labelKey: 'sidebar.groupTools',
      items: [
        { title: t('sidebar.safetyManagement'), url: `/${locale}/safety-management`, icon: HelpCircle },
        { title: t('sidebar.locationManagement'), url: `/${locale}/location-management`, icon: MapPin },
        { title: t('sidebar.reporting'), url: `/${locale}/reporting`, icon: FileSpreadsheet },
        { title: t('sidebar.documentManagement'), url: `/${locale}/document-management`, icon: FileText },
        { title: t('sidebar.chat'), url: `/${locale}/chat`, icon: MessageSquare },
      ],
    },
    {
      labelKey: 'sidebar.groupAdministration',
      items: [
        { title: t('sidebar.userManagement'), url: `/${locale}/user-management`, icon: Users },
        { title: 'Settings', url: `/${locale}/settings`, icon: Settings, requiredRole: 'SUPER_ADMIN' },
        { title: t('sidebar.databaseBackup'), url: `/${locale}/admin/backup`, icon: Database, requiredPermission: { action: 'manage', subject: 'all' } },
      ],
    },
  ], [t, locale]);

  const allDocumentItems: MenuItem[] = React.useMemo(() => [], []);

  // Memoize filter function to prevent recreation
  const filterMenuItems = React.useCallback((items: MenuItem[]) => {
    if (!user) return [];

    const essentialItems = items.filter(item => item.url === '#' || !item.url);
    const routeItems = items.filter(item => {
      if (item.url === '#' || !item.url) return false;
      if (item.requiredRole) return user.role === item.requiredRole;
      if (item.requiredPermission) return hasPermission(item.requiredPermission.action, item.requiredPermission.subject);
      if (item.url === `/${locale}/employee-dashboard`) return hasPermission('read', 'mydashboard');
      const routeWithoutLocale = item.url.replace(`/${locale}`, '');
      return canAccessRoute(routeWithoutLocale);
    });
    return [...essentialItems, ...routeItems];
  }, [user, locale, hasPermission, canAccessRoute]);

  // Filter each group and keep only groups with visible items
  const navGroups = React.useMemo(() => {
    return allNavGroups
      .map(group => ({
        ...group,
        items: filterMenuItems(group.items),
      }))
      .filter(group => group.items.length > 0);
  }, [allNavGroups, filterMenuItems]);

  const documents = React.useMemo(() => filterMenuItems(allDocumentItems), [filterMenuItems, allDocumentItems]);

  const data = React.useMemo(() => ({
    navGroups,
    documents,
  }), [navGroups, documents]);

  const borderColorClass = getRoleColorByRoleName(currentUserRole, roleColor, 'border', userPreferredColor);

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="sidebar"
      side={isRTL ? 'right' : 'left'}
      className={`w-64 border-l-2 border-r-0 ${borderColorClass} bg-sidebar shadow-[0_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]`}
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border/80 px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2.5 rounded-[var(--sidebar-radius)] hover:bg-sidebar-accent transition-colors duration-200 ease-out motion-reduce:transition-none cursor-pointer"
            >
              <Link href={`/${locale}`} className="flex items-center gap-3 min-w-0">
                {companyLogo ? (
                  <div className="relative h-9 w-9 flex-shrink-0 rounded-[var(--sidebar-radius)] overflow-hidden bg-sidebar-accent/80 flex items-center justify-center shadow-sm">
                    {companyLogo.startsWith('http') ? (
                      <img src={companyLogo} alt={appTitle} className="h-8 w-8 object-contain" />
                    ) : (
                      <Image src={companyLogo} alt={appTitle} width={36} height={36} className="object-contain" />
                    )}
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-[var(--sidebar-radius)] bg-sidebar-accent/80 flex items-center justify-center shadow-sm">
                    <Layers className="size-5 text-sidebar-foreground" />
                  </div>
                )}
                <span className="text-base font-semibold truncate text-sidebar-foreground">{appTitle}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <NavMain groups={data.navGroups} />
        <NavDocuments items={data.documents} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/80 px-3 py-3">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
