'use client';

import i18n from '@/lib/i18n-browser';
import { useEffect, useState } from 'react';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update document attributes when language changes, but only after mount
  useEffect(() => {
    if (mounted && i18n?.isInitialized) {
      try {
        const currentLang = i18n.language || 'en';
        const isRTLValue = currentLang === 'ar';
        
        setCurrentLanguage(currentLang);
        setIsRTL(isRTLValue);
        
        document.documentElement.lang = currentLang;
        document.documentElement.dir = isRTLValue ? 'rtl' : 'ltr';

        if (isRTLValue) {
          document.documentElement.classList.add('rtl');
        } else {
          document.documentElement.classList.remove('rtl');
        }
      } catch (error) {
        console.warn('Failed to update document attributes:', error);
      }
    }
  }, [mounted, i18n?.isInitialized, i18n?.language]);

  // Listen to i18next language changes
  useEffect(() => {
    if (mounted && i18n?.isInitialized) {
      const handleLanguageChanged = (lng: string) => {
        const isRTLValue = lng === 'ar';
        setCurrentLanguage(lng);
        setIsRTL(isRTLValue);
        
        document.documentElement.lang = lng;
        document.documentElement.dir = isRTLValue ? 'rtl' : 'ltr';
        
        if (isRTLValue) {
          document.documentElement.classList.add('rtl');
        } else {
          document.documentElement.classList.remove('rtl');
        }
      };

      i18n.on('languageChanged', handleLanguageChanged);
      
      return () => {
        i18n.off('languageChanged', handleLanguageChanged);
      };
    }
  }, [mounted, i18n?.isInitialized]);

  return <>{children}</>;
}
