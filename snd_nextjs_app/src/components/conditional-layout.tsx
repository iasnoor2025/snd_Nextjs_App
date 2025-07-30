"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useI18n } from "@/hooks/use-i18n";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { isRTL } = useI18n();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
    >
      <div className={`flex h-screen w-full overflow-hidden bg-background ${isRTL ? 'rtl' : ''}`}>
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 overflow-hidden peer">
          <SiteHeader />
          <main className="flex-1 overflow-auto p-6 transition-all duration-200 ease-linear main-content">
            <div className="w-full h-full max-w-none content-wrapper">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 