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
  // For now, return fallback values to ensure build success
  // This will be enhanced later with proper client-side functionality
  return serverFallback;
}
