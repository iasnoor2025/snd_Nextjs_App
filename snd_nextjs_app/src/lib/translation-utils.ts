import { useI18n } from '@/hooks/use-i18n';

/**
 * Format a number according to the current locale
 */
export function useNumberFormat() {
  const { currentLanguage } = useI18n();
  
  return (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(currentLanguage, options).format(value);
  };
}

/**
 * Format a date according to the current locale
 */
export function useDateFormat() {
  const { currentLanguage } = useI18n();
  
  return (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(currentLanguage, options).format(dateObj);
  };
}

/**
 * Format currency according to the current locale
 */
export function useCurrencyFormat() {
  const { currentLanguage } = useI18n();
  
  return (amount: number, currency = 'USD', options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
      ...options,
    }).format(amount);
  };
}

/**
 * Get the appropriate text direction class
 */
export function useTextDirection() {
  const { isRTL } = useI18n();
  
  return {
    textAlign: isRTL ? 'text-right' : 'text-left',
    flexDirection: isRTL ? 'flex-row-reverse' : 'flex-row',
    marginStart: isRTL ? 'mr-auto' : 'ml-auto',
    marginEnd: isRTL ? 'ml-auto' : 'mr-auto',
    paddingStart: isRTL ? 'pr-4' : 'pl-4',
    paddingEnd: isRTL ? 'pl-4' : 'pr-4',
  };
}

/**
 * Get RTL-aware spacing classes
 */
export function useRTLSpace() {
  const { isRTL } = useI18n();
  
  return {
    spaceX: isRTL ? 'space-x-reverse' : '',
    spaceY: '',
    marginX: isRTL ? 'mx-reverse' : '',
    paddingX: isRTL ? 'px-reverse' : '',
  };
}

/**
 * Format a translatable field with fallback
 */
export function formatTranslatableField(
  field: string | Record<string, string> | null | undefined,
  locale: string = 'en',
  fallbackLocale: string = 'en'
): string {
  if (typeof field === 'string') {
    return field;
  }
  
  if (!field || typeof field !== 'object') {
    return '';
  }
  
  // Try current locale first
  if (field[locale]) {
    return field[locale];
  }
  
  // Try fallback locale
  if (field[fallbackLocale]) {
    return field[fallbackLocale];
  }
  
  // Try any available translation
  const availableTranslations = Object.values(field);
  if (availableTranslations.length > 0) {
    return availableTranslations[0];
  }
  
  return '';
}

/**
 * Get all translations for a translatable field
 */
export function getAllTranslations(
  field: string | Record<string, string> | null | undefined
): Record<string, string> {
  if (typeof field === 'string') {
    return { en: field };
  }
  
  if (!field || typeof field !== 'object') {
    return {};
  }
  
  return { ...field };
}

/**
 * Format a translatable field for form input
 */
export function formatForForm(
  field: string | Record<string, string> | null | undefined,
  availableLocales: string[] = ['en', 'ar']
): Record<string, string> {
  if (typeof field === 'string') {
    const result: Record<string, string> = {};
    availableLocales.forEach(locale => {
      result[locale] = field;
    });
    return result;
  }
  
  if (!field || typeof field !== 'object') {
    const result: Record<string, string> = {};
    availableLocales.forEach(locale => {
      result[locale] = '';
    });
    return result;
  }
  
  const result: Record<string, string> = {};
  availableLocales.forEach(locale => {
    result[locale] = field[locale] || '';
  });
  
  return result;
} 