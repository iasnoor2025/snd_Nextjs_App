'use client';

import { LoginForm } from '@/components/login-form';
import { GalleryVerticalEnd } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Fallback text in case i18n fails
const FALLBACK_TEXTS = {
  loading: 'Loading...',
  app_name: 'SND Rental Management',
};

export default function LoginPage() {
  const [i18nReady, setI18nReady] = useState(false);
  const [i18nError, setI18nError] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Safe i18n usage with fallback
  let t: any;
  try {
    // Try to use i18n, but don't let it break the page
    const { useTranslation } = require('react-i18next');
    const translation = useTranslation('auth');
    t = translation.t;
    if (!i18nReady) setI18nReady(true);
  } catch (error) {
    setI18nError(true);
    // Use fallback function
    t = (key: string) => FALLBACK_TEXTS[key as keyof typeof FALLBACK_TEXTS] || key;
  }

  // Safe NextAuth usage with error handling
  let session: any, status: any;
  try {
    const authResult = useSession();
    session = authResult.data;
    status = authResult.status;
  } catch (error) {
    setAuthError('Authentication system error');
    status = 'error';
  }

  const router = useRouter();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'error') return;

    if (session) {
      // Redirect to home page (dashboard)
      router.push('/');
    }
  }, [session, status, router]);

  // Show error state if NextAuth fails completely
  if (status === 'error' || authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ Authentication Error</div>
          <p className="text-muted-foreground mb-4">
            {authError || 'Failed to initialize authentication system'}
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
        
        {/* Show warning if i18n failed */}
        {i18nError && (
          <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Some text may not be translated properly
            </p>
          </div>
        )}
        
        {/* Diagnostic button for production debugging */}
        {process.env.NODE_ENV === 'production' && (
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
          </button>
        )}
        
        {showDiagnostics && (
          <div className="text-xs text-left p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || 'Not set'}</p>
            <p><strong>i18n Status:</strong> {i18nError ? 'Failed' : 'Working'}</p>
            <p><strong>Auth Status:</strong> {status}</p>
            <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
          </div>
        )}
        
        <LoginForm />
      </div>
    </div>
  );
}
