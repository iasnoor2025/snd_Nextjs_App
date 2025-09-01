'use client';

import { I18nextProvider } from 'react-i18next';
import { useEffect } from 'react';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Initialize i18n on client side
    const initI18n = async () => {
      try {
        const { default: i18n } = await import('@/lib/i18n-browser');
        
        // Set up document attributes for RTL
        if (typeof window !== 'undefined') {
          const lang = i18n.language || 'en';
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
          if (lang === 'ar') {
            document.documentElement.classList.add('rtl');
          } else {
            document.documentElement.classList.remove('rtl');
          }
        }
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
      }
    };

    if (typeof window !== 'undefined') {
      initI18n();
    }
  }, []);

  return <>{children}</>;
}
