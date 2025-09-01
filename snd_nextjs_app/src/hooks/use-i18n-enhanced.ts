'use client';

import { useEffect, useState } from 'react';

// Global variables to avoid SSR issues
let globalI18n: any = null;
let globalT: any = null;
let globalCurrentLanguage = 'en';
let globalIsRTL = false;
let globalIsLoading = true;

export function useI18nEnhanced() {
  const [currentLanguage, setCurrentLanguage] = useState(globalCurrentLanguage);
  const [isRTL, setIsRTL] = useState(globalIsRTL);
  const [isLoading, setIsLoading] = useState(globalIsLoading);
  const [i18nInstance, setI18nInstance] = useState(globalI18n);

  // Initialize i18n on client side only
  useEffect(() => {
    const initI18n = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { default: i18n } = await import('@/lib/i18n-browser');
        
        // Set global variables
        globalI18n = i18n;
        globalT = i18n.t.bind(i18n);
        globalIsLoading = false;
        globalCurrentLanguage = i18n.language || 'en';
        globalIsRTL = globalCurrentLanguage === 'ar';

        // Update state
        setI18nInstance(i18n);
        setIsLoading(false);
        setCurrentLanguage(globalCurrentLanguage);
        setIsRTL(globalIsRTL);

        // Set up document attributes for RTL
        if (typeof window !== 'undefined') {
          document.documentElement.dir = globalIsRTL ? 'rtl' : 'ltr';
          document.documentElement.lang = globalCurrentLanguage;
          if (globalIsRTL) {
            document.documentElement.classList.add('rtl');
          } else {
            document.documentElement.classList.remove('rtl');
          }
        }
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        globalIsLoading = false;
        setIsLoading(false);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined' && !globalI18n) {
      initI18n();
    } else if (globalI18n) {
      // Use existing global instance
      setI18nInstance(globalI18n);
      setIsLoading(false);
      setCurrentLanguage(globalCurrentLanguage);
      setIsRTL(globalIsRTL);
    }
  }, []);

  // Enhanced translation function
  const t = (key: string, options?: Record<string, any>): string => {
    try {
      // Use global function if available
      if (globalT && globalI18n?.isInitialized) {
        // Handle namespace.key format
        if (typeof key === 'string' && key.includes('.')) {
          const firstDotIndex = key.indexOf('.');
          const namespace = key.slice(0, firstDotIndex);
          const keyPath = key.slice(firstDotIndex + 1);
          return globalI18n.t(keyPath, { ...(options || {}), ns: namespace });
        }
        return globalT(key, options);
      }
      
      // Fallback to key if i18n not ready
      return key;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key;
    }
  };

  const languages = [
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      dir: 'ltr' as const,
    },
    {
      code: 'ar',
      name: 'العربية',
      flag: '🇸🇦',
      dir: 'rtl' as const,
    },
  ];

  const changeLanguage = async (language: string) => {
    if (!globalI18n) return;

    const selectedLanguage = languages.find(lang => lang.code === language);
    if (selectedLanguage) {
      try {
        // Store language preference
        if (typeof window !== 'undefined') {
          localStorage.setItem('i18nextLng', language);
          sessionStorage.setItem('i18nextLng', language);
        }

        // Update language in i18next
        await globalI18n.changeLanguage(language);
        
        // Update global variables
        globalCurrentLanguage = language;
        globalIsRTL = selectedLanguage.dir === 'rtl';
        
        // Update state
        setCurrentLanguage(language);
        setIsRTL(globalIsRTL);

        // Update document attributes for RTL support
        if (typeof window !== 'undefined') {
          document.documentElement.dir = selectedLanguage.dir;
          document.documentElement.lang = language;
          
          if (selectedLanguage.dir === 'rtl') {
            document.documentElement.classList.add('rtl');
          } else {
            document.documentElement.classList.remove('rtl');
          }
        }

        // Save to database (optional)
        try {
          await fetch('/api/user/language', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language }),
          });
        } catch (error) {
          console.warn('Failed to save language preference to database:', error);
        }
      } catch (error) {
        console.error('Error changing language:', error);
      }
    }
  };

  const direction = isRTL ? 'rtl' : 'ltr';

  return {
    t,
    i18n: i18nInstance,
    currentLanguage,
    isRTL,
    changeLanguage,
    direction,
    languages,
    isLoading,
  };
}
