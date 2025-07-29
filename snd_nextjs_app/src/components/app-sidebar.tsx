"use client"
import * as React from "react"
import {
  IconBuilding,
  IconCalendar,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconHelp,
  IconInnerShadowTop,
  IconReport,
  IconSearch,
  IconSettings,
  IconTools,
  IconUsers,
  IconUser,
} from "@tabler/icons-react"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin User",
    email: "admin@snd.com",
    avatar: undefined,
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Customer Management",
      url: "/modules/customer-management",
      icon: IconUsers,
    },
    {
      title: "Company Management",
      url: "/modules/company-management",
      icon: IconBuilding,
    },
    {
      title: "Employee Management",
      url: "/modules/employee-management",
      icon: IconUsers,
    },
    {
      title: "Equipment Management",
      url: "/modules/equipment-management",
      icon: IconTools,
    },
    {
      title: "Rental Management",
      url: "/modules/rental-management",
      icon: IconCalendar,
    },
    {
      title: "Timesheet Management",
      url: "/modules/timesheet-management",
      icon: IconCalendar,
    },
    {
      title: "Project Management",
      url: "/modules/project-management",
      icon: IconFileDescription,
    },
    {
      title: "Payroll Management",
      url: "/modules/payroll-management",
      icon: IconChartBar,
    },
    {
      title: "Leave Management",
      url: "/modules/leave-management",
      icon: IconCalendar,
    },
    {
      title: "Safety Management",
      url: "/modules/safety-management",
      icon: IconHelp,
    },
    {
      title: "Reporting",
      url: "/modules/reporting",
      icon: IconReport,
    },
    {
      title: "User Management",
      url: "/modules/user-management",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/modules/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Analytics",
      url: "/modules/analytics",
      icon: IconChartBar,
    },
    {
      name: "Audit & Compliance",
      url: "/modules/audit-compliance",
      icon: IconDatabase,
    },
    {
      name: "Localization",
      url: "/modules/localization",
      icon: IconFileDescription,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
      <Sidebar collapsible="offcanvas" variant="sidebar" side="left" className="w-64" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="#">
                  <IconInnerShadowTop className="!size-5" />
                  <span className="text-base font-semibold">SND Rental</span>
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
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
    )
  }

