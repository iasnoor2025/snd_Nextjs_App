'use client';

import { useEffect, useState } from 'react';
import i18n from '@/lib/i18n-browser';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // i18next is already initialized when the module is imported
    if (i18n.isInitialized) {
      setIsInitialized(true);
    } else {
      // Wait for initialization to complete
      const checkInitialization = () => {
        if (i18n.isInitialized) {
          setIsInitialized(true);
        } else {
          setTimeout(checkInitialization, 100);
        }
      };
      checkInitialization();
    }
  }, []);

  // Always render children to prevent hydration mismatch
  return <>{children}</>;
}
