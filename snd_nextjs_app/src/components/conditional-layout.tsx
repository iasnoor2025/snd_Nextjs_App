'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { NationIdModal } from '@/components/nation-id-modal';
import { NationIdRequired } from '@/components/nation-id-required';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useI18n } from '@/hooks/use-i18n';
import { useNationIdCheck } from '@/hooks/use-nation-id-check';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { isRTL } = useI18n();
  const { data: session, status } = useSession();
  const isLoginPage = pathname === '/login';
  const { isModalOpen, closeModal, nationIdData, isChecking, refreshCheck } = useNationIdCheck();

  // Check if user is an employee
  const isEmployee = session?.user?.role === 'EMPLOYEE';

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Show loading state only on first login verification
  if (isChecking && nationIdData?.isFirstLogin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Show Nation ID required page if user doesn't have Nation ID on first login
  if (nationIdData?.isFirstLogin && nationIdData && !nationIdData.hasNationId) {
    return (
      <NationIdRequired
        userName={nationIdData.userName || ''}
        userEmail={nationIdData.userEmail || ''}
        onNationIdSet={refreshCheck}
      />
    );
  }

  // For employees, show a simplified layout without sidebar
  if (isEmployee) {
    return (
      <>
        <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : ''}`}>
          <SiteHeader />
          <main className="flex-1 overflow-auto p-6 transition-all duration-200 ease-linear main-content w-full">
            <div className="w-full h-full max-w-none content-wrapper content-full-width">{children}</div>
          </main>
        </div>

        {/* Nation ID Modal - Only show if user doesn't have Nation ID on first login */}
        {nationIdData?.isFirstLogin && nationIdData && !nationIdData.hasNationId && (
          <NationIdModal
            isOpen={isModalOpen}
            onClose={closeModal}
            userName={nationIdData.userName || ''}
            userEmail={nationIdData.userEmail || ''}
            matchedEmployee={nationIdData.matchedEmployee}
          />
        )}
      </>
    );
  }

  // For other roles, show the full layout with sidebar
  return (
    <>
      <SidebarProvider
        defaultOpen={true}
        style={
          {
            '--sidebar-width': '16rem',
            '--header-height': '4rem',
          } as React.CSSProperties
        }
      >
        <div className={`flex h-screen w-full overflow-hidden bg-background ${isRTL ? 'rtl' : ''}`}>
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col min-w-0 overflow-hidden peer">
            <SiteHeader />
            <main className="flex-1 overflow-auto p-6 transition-all duration-200 ease-linear main-content w-full">
              <div className="w-full h-full max-w-none content-wrapper content-full-width">{children}</div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* Nation ID Modal - Only show if user doesn't have Nation ID on first login */}
      {nationIdData?.isFirstLogin && nationIdData && !nationIdData.hasNationId && (
        <NationIdModal
          isOpen={isModalOpen}
          onClose={closeModal}
          userName={nationIdData.userName || ''}
          userEmail={nationIdData.userEmail || ''}
          matchedEmployee={nationIdData.matchedEmployee}
        />
      )}
    </>
  );
}
