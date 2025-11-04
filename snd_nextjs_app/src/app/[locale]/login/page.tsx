'use client';

import { LoginForm } from '@/components/login-form';
import { GalleryVerticalEnd } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';

export default function LoginPage() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Hooks must be called unconditionally - never wrap in try-catch
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'error') return;

    if (session) {
      // Get locale from params or default to 'en'
      const locale = (params?.locale as string) || 'en';
      // Redirect to locale-prefixed home page
      window.location.href = `/${locale}`;
    }
  }, [session, status, params]);

  // Show error state if NextAuth fails completely
  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ Authentication Error</div>
          <p className="text-muted-foreground mb-4">
            Failed to initialize authentication system. Please refresh the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          {t('app_name')}
        </a>
        
        {/* Diagnostic button for debugging */}
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="text-xs text-muted-foreground hover:text-foreground self-start"
        >
          {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
        </button>
        
        {showDiagnostics && (
          <div className="text-xs text-left p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || 'Not set'}</p>
            <p><strong>Auth Status:</strong> {String(status)}</p>
            <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
          </div>
        )}
        
        <LoginForm />
      </div>
    </div>
  );
}