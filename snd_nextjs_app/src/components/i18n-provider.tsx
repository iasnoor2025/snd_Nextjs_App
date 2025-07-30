'use client';

import { useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { currentLanguage, isRTL } = useI18n();

  // Update document attributes when language changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        document.documentElement.lang = currentLanguage;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        
        if (isRTL) {
          document.documentElement.classList.add('rtl');
        } else {
          document.documentElement.classList.remove('rtl');
        }
      } catch (error) {
        console.error('Error setting document attributes:', error);
      }
    }
  }, [currentLanguage, isRTL]);

  return <>{children}</>;
} 