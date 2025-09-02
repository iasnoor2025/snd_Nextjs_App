'use client';

import { useParams, useRouter, usePathname } from 'next/navigation';
import { validateLocale } from '@/lib/locale-utils';
import { useEffect, useState } from 'react';

export function useTranslations() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Safely extract locale with fallback
  const locale = validateLocale(params?.locale as string);
  const [dictionary, setDictionary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    // Load dictionary
    const loadDictionary = async () => {
      if (!locale) return;
      
      setIsLoading(true);
      try {
        const { getDictionary } = await import('@/lib/get-dictionary');
        const dict = await getDictionary(locale as any);
        setDictionary(dict);
      } catch (error) {
        console.error('Failed to load dictionary:', error);
        // Fallback to English if loading fails
        try {
          const { getDictionary } = await import('@/lib/get-dictionary');
          const dict = await getDictionary('en');
          setDictionary(dict);
        } catch (fallbackError) {
          console.error('Failed to load fallback dictionary:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDictionary();
  }, [locale]);

  const t = (key: string, params?: Record<string, string>) => {
    if (!dictionary || isLoading) return key;

    // Handle namespace.key format (e.g., "common.save", "dashboard.title")
    if (key.includes('.')) {
      const [namespace, ...keyParts] = key.split('.');
      const fullKey = keyParts.join('.');
      
      const namespaceDict = dictionary[namespace as keyof typeof dictionary];
      if (!namespaceDict) return key;

      // Navigate to nested key
      let value: any = namespaceDict;
      for (const k of fullKey.split('.')) {
        value = value?.[k];
        if (value === undefined) return key;
      }

      // Replace parameters
      if (params && typeof value === 'string') {
        Object.entries(params).forEach(([param, replacement]) => {
          value = value.replace(new RegExp(`{{${param}}}`, 'g'), replacement);
        });
      }

      return value || key;
    }

    // Fallback to common namespace if no namespace specified
    const commonDict = dictionary.common;
    if (commonDict && commonDict[key]) {
      let value = commonDict[key];
      
      // Replace parameters
      if (params && typeof value === 'string') {
        Object.entries(params).forEach(([param, replacement]) => {
          value = value.replace(new RegExp(`{{${param}}}`, 'g'), replacement);
        });
      }
      
      return value;
    }

    return key;
  };

  const changeLanguage = async (newLocale: string) => {
    try {
      // Remove current locale from pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
      
      // Navigate to new locale
      router.push(`/${newLocale}${pathWithoutLocale}`);
      
      // Save to cookie
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
      
      // Save to database (optional)
      try {
        await fetch('/api/user/language', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLocale }),
        });
      } catch (error) {
        console.warn('Failed to save language preference to database:', error);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return {
    t,
    locale,
    isRTL: locale === 'ar',
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    languages,
    changeLanguage,
    isLoading,
  };
}
