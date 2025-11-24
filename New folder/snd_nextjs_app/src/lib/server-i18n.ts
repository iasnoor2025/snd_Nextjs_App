import { NextRequest } from 'next/server';

// Import translation files
import enPayroll from '@/dictionaries/en/payroll.json';
import arPayroll from '@/dictionaries/ar/payroll.json';
import enCommon from '@/dictionaries/en/common.json';
import arCommon from '@/dictionaries/ar/common.json';

const translations = {
  en: {
    payroll: enPayroll,
    common: enCommon,
  },
  ar: {
    payroll: arPayroll,
    common: arCommon,
  },
};

export type SupportedLocale = 'en' | 'ar';

/**
 * Get locale from request headers
 */
export function getLocaleFromRequest(request: NextRequest): SupportedLocale {
  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  
  if (acceptLanguage) {
    // Parse the Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = '1'] = lang.trim().split(';q=');
        return { code: code?.toLowerCase() || 'en', priority: parseFloat(q) };
      })
      .sort((a, b) => b.priority - a.priority);

    // Find first supported language
    for (const lang of languages) {
      if (lang.code.startsWith('ar')) return 'ar';
      if (lang.code.startsWith('en')) return 'en';
    }
  }

  // Default to English
  return 'en';
}

/**
 * Server-side translation function
 */
export function createServerTranslator(locale: SupportedLocale = 'en') {
  const t = (key: string, options?: Record<string, any>): string => {
    try {
      const [namespace, ...keyPath] = key.split('.');
      const translationNamespace = translations[locale]?.[namespace as keyof typeof translations[typeof locale]];
      
      if (!translationNamespace) {
        console.warn(`Translation namespace '${namespace}' not found for locale '${locale}'`);
        return key;
      }

      // Navigate through the nested key path
      let value: any = translationNamespace;
      for (const pathSegment of keyPath) {
        value = value?.[pathSegment];
        if (value === undefined) break;
      }

      if (typeof value === 'string') {
        // Handle interpolation
        if (options) {
          return value.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
            return options[variable]?.toString() || match;
          });
        }
        return value;
      }

      // Fallback to English if translation not found in current locale
      if (locale !== 'en') {
        const englishNamespace = translations.en?.[namespace as keyof typeof translations.en];
        let englishValue: any = englishNamespace;
        for (const pathSegment of keyPath) {
          englishValue = englishValue?.[pathSegment];
          if (englishValue === undefined) break;
        }
        
        if (typeof englishValue === 'string') {
          if (options) {
            return englishValue.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
              return options[variable]?.toString() || match;
            });
          }
          return englishValue;
        }
      }

      console.warn(`Translation key '${key}' not found for locale '${locale}'`);
      return key;
    } catch (error) {
      console.error(`Error translating key '${key}':`, error);
      return key;
    }
  };

  return { t, locale };
}

/**
 * Create translator from request
 */
export function createTranslatorFromRequest(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  return createServerTranslator(locale);
}
