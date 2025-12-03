'use client';

import i18n from '@/lib/i18n-browser';
import { useEffect, useState } from 'react';

interface I18nSafeWrapperProps {
  children: React.ReactNode;
}

export function I18nSafeWrapper({ children }: I18nSafeWrapperProps) {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Check if i18n is initialized
      if (i18n?.isInitialized) {
        setIsI18nReady(true);
      } else {
        // Wait for i18n to be initialized
        const checkI18n = () => {
          if (i18n?.isInitialized) {
            setIsI18nReady(true);
          } else {
            // Check again in 100ms
            setTimeout(checkI18n, 100);
          }
        };
        checkI18n();
      }
    }
  }, [mounted]);

  // Show loading state while i18n is initializing
  if (!mounted || !isI18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
