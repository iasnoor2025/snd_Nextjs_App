'use client';

import i18n from '@/lib/i18n-browser';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useI18n() {
  const { t: i18nextT } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Namespace-aware translator: supports 'namespace.key.path'
  const t = (key: string, options?: Record<string, any>): string => {
    try {
      if (typeof key === 'string' && key.includes('.')) {
        const firstDotIndex = key.indexOf('.');
        const namespace = key.slice(0, firstDotIndex);
        const keyPath = key.slice(firstDotIndex + 1);
        // Delegate to i18next with explicit namespace
        return i18nextT(keyPath, { ...(options || {}), ns: namespace });
      }
      return i18nextT(key as any, options as any);
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key; // Fallback to the key itself
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
    const selectedLanguage = languages.find(lang => lang.code === language);
    if (selectedLanguage && mounted && i18n.isInitialized) {
      try {

        
        // Store language preference first
        localStorage.setItem('i18nextLng', language);
        sessionStorage.setItem('i18nextLng', language);

        // Update language preference in database
        try {
          const response = await fetch('/api/user/language', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ language }),
          });

          if (response.ok) {
            const result = await response.json();
            // Language preference saved to database successfully
          } else {
            const error = await response.text();
            console.warn('Failed to save language preference to database. Status:', response.status, 'Error:', error);
          }
        } catch (dbError) {
          console.warn('Network error saving language preference to database:', dbError);
        }

        // Change language in i18next first
        i18n.changeLanguage(language).then(() => {
          // Update state after i18next has changed
          setCurrentLanguage(language);
          setIsRTL(selectedLanguage.dir === 'rtl');

          // Update document direction for RTL support
          document.documentElement.dir = selectedLanguage.dir;
          document.documentElement.lang = language;

          // Add RTL class if needed
          if (selectedLanguage.dir === 'rtl') {
            document.documentElement.classList.add('rtl');
          } else {
            document.documentElement.classList.remove('rtl');
          }
        });

      } catch (error) {
        console.error('Error changing language:', error);
      }
    }
  };

  const direction = isRTL ? 'rtl' : 'ltr';

  // Set mounted state and initialize i18n
  useEffect(() => {
    setMounted(true);
    // i18n is now initialized by I18nWrapper, so we can set loading to false
    setIsLoading(false);
  }, []);

  // Initialize language and direction after mount
  useEffect(() => {
    if (mounted && i18n.isInitialized) {
      try {
        // Get the current language from i18next instance
        const currentI18nLanguage = i18n.language || 'en';
        
        const selectedLanguage = languages.find(lang => lang.code === currentI18nLanguage);

        if (selectedLanguage) {
          setCurrentLanguage(currentI18nLanguage);
          setIsRTL(selectedLanguage.dir === 'rtl');

          // Set document direction
          try {
            document.documentElement.dir = selectedLanguage.dir;
            document.documentElement.lang = currentI18nLanguage;

            // Add RTL class if needed
            if (selectedLanguage.dir === 'rtl') {
              document.documentElement.classList.add('rtl');
            } else {
              document.documentElement.classList.remove('rtl');
            }
          } catch (error) {
            console.warn('Failed to update document attributes:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing language:', error);
        // Fallback to English
        setCurrentLanguage('en');
        setIsRTL(false);
        try {
          document.documentElement.dir = 'ltr';
          document.documentElement.lang = 'en';
          document.documentElement.classList.remove('rtl');
        } catch (docError) {
          console.warn('Failed to set fallback document attributes:', docError);
        }
      }
    }
  }, [mounted, languages, i18n.isInitialized, i18n.language]);

  // Listen to i18next language changes to keep state in sync
  useEffect(() => {
    if (mounted) {
      const handleLanguageChanged = (lng: string) => {
        const selectedLanguage = languages.find(lang => lang.code === lng);
        if (selectedLanguage) {
          setCurrentLanguage(lng);
          setIsRTL(selectedLanguage.dir === 'rtl');
          
          // Update document attributes
          document.documentElement.dir = selectedLanguage.dir;
          document.documentElement.lang = lng;
          
          if (selectedLanguage.dir === 'rtl') {
            document.documentElement.classList.add('rtl');
          } else {
            document.documentElement.classList.remove('rtl');
          }
        }
      };

      // Listen for language changes
      i18n.on('languageChanged', handleLanguageChanged);
      
      // Also check for language consistency periodically
      const checkLanguageConsistency = () => {
        const currentLang = i18n.language;
        const savedLang = localStorage.getItem('i18nextLng') || sessionStorage.getItem('i18nextLng');
        
        if (currentLang && savedLang && currentLang !== savedLang) {
          i18n.changeLanguage(savedLang);
        }
        
        // Also check if the document attributes are correct
        if (savedLang && ['en', 'ar'].includes(savedLang)) {
          const selectedLanguage = languages.find(lang => lang.code === savedLang);
          if (selectedLanguage) {
            const correctDir = selectedLanguage.dir;
            const correctLang = savedLang;
            
                         if (document.documentElement.dir !== correctDir || document.documentElement.lang !== correctLang) {
              document.documentElement.dir = correctDir;
              document.documentElement.lang = correctLang;
              
              if (correctDir === 'rtl') {
                document.documentElement.classList.add('rtl');
              } else {
                document.documentElement.classList.remove('rtl');
              }
            }
          }
        }
      };

      // Check immediately and then every 2 seconds
      checkLanguageConsistency();
      const interval = setInterval(checkLanguageConsistency, 2000);
      
      return () => {
        i18n.off('languageChanged', handleLanguageChanged);
        clearInterval(interval);
      };
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
    isLoading,
  };
}
