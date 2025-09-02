'use client';

import { useTranslations } from './use-translations';

// Simple server-safe fallback that always works
const serverFallback = {
  t: (key: string) => key,
  i18n: null,
  currentLanguage: 'en',
  isRTL: false,
  changeLanguage: async () => {},
  direction: 'ltr' as const,
  languages: [
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
  ],
  isLoading: false,
};

export function useI18n() {
  try {
    // Use the actual translations hook for client-side functionality
    return useTranslations();
  } catch (error) {
    // Fallback to server-safe values if there's an error
    console.warn('useI18n fallback to server-safe values:', error);
    return serverFallback;
  }
}
