"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useI18n } from "@/hooks/use-i18n";
import { useNationIdCheck } from "@/hooks/use-nation-id-check";
import { NationIdModal } from "@/components/nation-id-modal";
import { NationIdRequired } from "@/components/nation-id-required";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { isRTL } = useI18n();
  const isLoginPage = pathname === "/login";
  const { isModalOpen, closeModal, nationIdData, isChecking, refreshCheck } = useNationIdCheck();

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  // Show loading state while checking Nation ID
  if (isChecking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your profile...</p>
        </div>
      </div>
    );
  }

  // Show Nation ID required page if user doesn't have Nation ID
  if (nationIdData && !nationIdData.hasNationId) {
    return (
      <NationIdRequired
        userName={nationIdData.userName || ""}
        userEmail={nationIdData.userEmail || ""}
        onNationIdSet={refreshCheck}
      />
    );
  }

  return (
    <>
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
      
             {/* Nation ID Modal - Only show if user doesn't have Nation ID */}
       {nationIdData && !nationIdData.hasNationId && (
         <NationIdModal
           isOpen={isModalOpen}
           onClose={closeModal}
           userName={nationIdData.userName || ""}
           userEmail={nationIdData.userEmail || ""}
           matchedEmployee={nationIdData.matchedEmployee}
         />
       )}
    </>
  );
} 