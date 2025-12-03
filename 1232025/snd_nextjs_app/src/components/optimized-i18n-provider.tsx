'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n-dynamic';
import { loadNamespaces } from '@/lib/i18n-dynamic';

interface OptimizedI18nProviderProps {
  children: React.ReactNode;
  initialNamespaces?: string[];
}

export function OptimizedI18nProvider({ 
  children, 
  initialNamespaces = ['common', 'auth'] 
}: OptimizedI18nProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadInitialTranslations = async () => {
      // Load initial namespaces
      await loadNamespaces(initialNamespaces);
      setIsLoaded(true);
    };

    if (i18n.isInitialized) {
      loadInitialTranslations();
    } else {
      // Wait for i18n to initialize
      i18n.on('initialized', () => {
        loadInitialTranslations();
      });
    }

    return () => {
      i18n.off('initialized');
    };
  }, [initialNamespaces]);

  // Show loading state while translations are loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
