'use client';

import i18n, { initializeI18n } from '@/lib/i18n-browser';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

interface I18nWrapperProps {
  children: React.ReactNode;
}

export function I18nWrapper({ children }: I18nWrapperProps) {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initialize i18n only in browser
    if (typeof window !== 'undefined') {
      initializeI18n().then(() => {
        setI18nReady(true);
      }).catch((error) => {
        console.error('Failed to initialize i18n:', error);
        // Still set ready to prevent infinite loading
        setI18nReady(true);
      });
    } else {
      setI18nReady(true);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && i18nReady) {
      const loadUserLanguage = async () => {
        try {
          const response = await fetch('/api/user/language');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.language) {
              i18n.changeLanguage(data.language);
            }
          } else {
            console.warn('Failed to load user language preference');
          }
        } catch (error) {
          console.warn('Error loading user language preference:', error);
        }
      };

      loadUserLanguage();
    }
  }, [status, session?.user?.id, i18nReady]);

  // Don't render anything until mounted and i18n is ready
  if (!mounted || !i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Wrap children with I18nextProvider to ensure i18n context is available
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
