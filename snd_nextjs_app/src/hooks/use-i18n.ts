'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export interface UseI18nReturn {
  t: (key: string, options?: any) => string;
  i18n: any;
  currentLanguage: string;
  isRTL: boolean;
  changeLanguage: (language: string) => void;
  direction: 'ltr' | 'rtl';
  languages: Array<{
    code: string;
    name: string;
    flag: string;
    dir: 'ltr' | 'rtl';
  }>;
}

export function useI18n(): UseI18nReturn {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('en'); // Default to English
  const [isRTL, setIsRTL] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const changeLanguage = (language: string) => {
    const selectedLanguage = languages.find((lang) => lang.code === language);
    if (selectedLanguage && mounted) {
      try {
        // Change language in i18next
        i18n.changeLanguage(language);

        // Update document direction for RTL support
        document.documentElement.dir = selectedLanguage.dir;
        document.documentElement.lang = language;

        // Add or remove RTL class
        if (selectedLanguage.dir === 'rtl') {
          document.documentElement.classList.add('rtl');
        } else {
          document.documentElement.classList.remove('rtl');
        }

        // Store language preference
        localStorage.setItem('i18nextLng', language);
        sessionStorage.setItem('i18nextLng', language);

        // Update state
        setCurrentLanguage(language);
        setIsRTL(selectedLanguage.dir === 'rtl');
      } catch (error) {
        console.error('Error changing language:', error);
      }
    }
  };

  const direction = isRTL ? 'rtl' : 'ltr';

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize language and direction after mount
  useEffect(() => {
    if (mounted) {
      const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
      const selectedLanguage = languages.find((lang) => lang.code === savedLanguage);
      
      if (selectedLanguage) {
        setCurrentLanguage(savedLanguage);
        setIsRTL(selectedLanguage.dir === 'rtl');
        
        // Set document direction
        document.documentElement.dir = selectedLanguage.dir;
        document.documentElement.lang = savedLanguage;
        
        // Add RTL class if needed
        if (selectedLanguage.dir === 'rtl') {
          document.documentElement.classList.add('rtl');
        } else {
          document.documentElement.classList.remove('rtl');
        }
      }
    }
  }, [mounted, languages]);

  return {
    t,
    i18n,
    currentLanguage,
    isRTL,
    changeLanguage,
    direction,
    languages,
  };
} 
