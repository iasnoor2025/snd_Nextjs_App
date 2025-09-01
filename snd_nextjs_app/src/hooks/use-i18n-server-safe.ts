// Server-safe fallback values
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
  isLoading: true,
};

export function useI18n() {
  // Always return fallback values for now to avoid SSR issues
  return serverFallback;
}
