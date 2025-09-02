import { i18n } from './i18n-config';

/**
 * Safely validates and normalizes a locale value
 * @param locale - The raw locale value from params or other sources
 * @returns A valid locale string, defaults to 'en'
 */
export function validateLocale(locale: string | undefined | null): string {
  if (!locale) return i18n.defaultLocale;
  
  // Ensure the locale is a valid string and is in our supported locales
  if (typeof locale === 'string' && i18n.locales.includes(locale as any)) {
    return locale;
  }
  
  return i18n.defaultLocale;
}

/**
 * Checks if a locale is valid
 * @param locale - The locale to check
 * @returns True if the locale is valid
 */
export function isValidLocale(locale: string | undefined | null): boolean {
  return typeof locale === 'string' && i18n.locales.includes(locale as any);
}
