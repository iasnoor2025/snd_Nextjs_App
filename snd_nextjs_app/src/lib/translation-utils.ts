import { useI18n } from '@/hooks/use-i18n';

/**
 * Format a number according to the current locale
 */
export function useNumberFormat() {
  const { t } = useI18n();

  return (value: number, options?: Intl.NumberFormatOptions) => {
    const locale = 'en-US'; // Use default locale
    return new Intl.NumberFormat(locale, options).format(value);
  };
}

/**
 * Format a date according to the current locale
 */
export function useDateFormat() {
  const { t } = useI18n();

  return (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = 'en-US'; // Use default locale or get from context
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  };
}

/**
 * Format currency according to the current locale
 */
export function useCurrencyFormat() {
  const { t } = useI18n();

  return (amount: number, currency = 'SAR', options?: Intl.NumberFormatOptions) => {
    const locale = 'ar-SA'; // Use SAR currency locale
    return new Intl.NumberFormat(locale, {
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
    return availableTranslations[0] || '';
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

// Common name mappings for Arabic translation
const nameMappings: { [key: string]: string } = {
  MOHAMAD: 'محمد',
  MOHAMMAD: 'محمد',
  MUHAMMAD: 'محمد',
  AHMED: 'أحمد',
  AHMAD: 'أحمد',
  ALI: 'علي',
  HASSAN: 'حسن',
  HUSSEIN: 'حسين',
  OMAR: 'عمر',
  KHALID: 'خالد',
  ABDULLAH: 'عبدالله',
  ABDUL: 'عبد',
  YOUSEF: 'يوسف',
  YUSUF: 'يوسف',
  IBRAHIM: 'إبراهيم',
  ISMAIL: 'إسماعيل',
  MUSTAFA: 'مصطفى',
  MAHMOUD: 'محمود',
  SALEM: 'سالم',
  SALEH: 'صالح',
  NADER: 'نادر',
  NADEEM: 'نديم',
  FARIS: 'فارس',
  TAREK: 'طارق',
  WALEED: 'وليد',
  SAMER: 'سامر',
  SAMI: 'سامي',
  ADEL: 'عادل',
  ADIL: 'عادل',
  KAMAL: 'كمال',
  JAMAL: 'جمال',
  RAHIM: 'رحيم',
  RAHEEM: 'رحيم',
  AKBAR: 'أكبر',
  KAWSAR: 'كوثر',
  AIUB: 'أيوب',
  MD: 'محمد',
  MR: 'السيد',
  MS: 'السيدة',
  DR: 'دكتور',
  PROF: 'أستاذ',
  ENG: 'مهندس',
};

// Phonetic transliteration mapping for English to Arabic
const phoneticMapping: { [key: string]: string } = {
  A: 'أ',
  B: 'ب',
  C: 'ك',
  D: 'د',
  E: 'إ',
  F: 'ف',
  G: 'ج',
  H: 'ه',
  I: 'ي',
  J: 'ج',
  K: 'ك',
  L: 'ل',
  M: 'م',
  N: 'ن',
  O: 'و',
  P: 'ب',
  Q: 'ق',
  R: 'ر',
  S: 'س',
  T: 'ت',
  U: 'و',
  V: 'ف',
  W: 'و',
  X: 'كس',
  Y: 'ي',
  Z: 'ز',
  TH: 'ث',
  CH: 'تش',
  SH: 'ش',
  PH: 'ف',
};

// In-memory cache for translations
const translationCache = new Map<string, string>();

// Track rate limiting status
let isRateLimited = false;
let rateLimitResetTime = 0;

/**
 * Convert English numerals to Arabic numerals
 * @param text - The text containing numbers to convert
 * @param isRTL - Whether the interface is in RTL (Arabic) mode
 * @returns The text with converted numerals
 */
export const convertToArabicNumerals = (
  text: string | null | undefined,
  isRTL: boolean
): string => {
  if (!text) return '';

  // Only convert numerals when interface is in Arabic mode
  if (!isRTL) {
    return text; // Return original text for English mode
  }

  return (
    text.replace(/[0-9]/g, d => {
      const num = parseInt(d);
      return num >= 0 && num <= 9 ? '٠١٢٣٤٥٦٧٨٩'[num] || d : d;
    })
  );
};

/**
 * Translate a name to Arabic using multiple methods
 * @param name - The name to translate
 * @param isRTL - Whether the interface is in RTL (Arabic) mode
 * @returns The translated name or original if not in Arabic mode
 */
export const translateNameToArabic = async (
  name: string | null | undefined,
  isRTL: boolean
): Promise<string> => {
  if (!name || !isRTL) return name || '';

  // Check cache first
  if (translationCache.has(name)) {
    return translationCache.get(name)!;
  }

  // Convert to uppercase for matching
  const upperName = name.toUpperCase();

  // Split the name into parts
  const nameParts = upperName.split(' ');

  // Check if all parts are in our mappings
  const allPartsMapped = nameParts.every(part => {
    const cleanPart = part.replace(/[^A-Z]/g, '');
    return nameMappings[cleanPart];
  });

  // If all parts are mapped, use our mappings
  if (allPartsMapped) {
    const translatedParts = nameParts.map(part => {
      const cleanPart = part.replace(/[^A-Z]/g, '');
      return nameMappings[cleanPart] || part;
    });
    const result = translatedParts.join(' ');
    translationCache.set(name, result);
    return result;
  }

  // If not all parts are mapped, try Google Translate API
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: name,
        targetLanguage: 'ar',
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.translatedText && result.translatedText !== name) {
        translationCache.set(name, result.translatedText);
        return result.translatedText;
      }
    } else if (response.status === 429) {
      // Rate limited - return original name and don't retry
      console.warn('Translation rate limited for:', name);
      isRateLimited = true;
      rateLimitResetTime = Date.now() + 60000; // Reset in 1 minute
      return name;
    }
  } catch (error) {
    console.warn('Translation API error for:', name, error);
  }

  // Fallback: phonetic transliteration
  const transliteratedParts = nameParts.map(part => {
    const cleanPart = part.replace(/[^A-Z]/g, '');
    let transliterated = '';

    for (let i = 0; i < cleanPart.length; i++) {
      const char = cleanPart[i];
      const nextChar = cleanPart[i + 1];

      // Handle common digraphs
      if (i < cleanPart.length - 1 && char && nextChar) {
        const digraph = char + nextChar;
        if (phoneticMapping[digraph]) {
          transliterated += phoneticMapping[digraph];
          i++; // Skip next character
          continue;
        }
      }

      // Handle single characters
      if (char) {
        transliterated += phoneticMapping[char] || char;
      }
    }

    return transliterated;
  });

  const result = transliteratedParts.join(' ');
  translationCache.set(name, result);
  return result;
};

/**
 * Get translated name with caching (for React components)
 * @param name - The name to translate
 * @param isRTL - Whether the interface is in RTL (Arabic) mode
 * @param translatedNames - State object for caching translations
 * @param setTranslatedNames - State setter for caching translations
 * @returns The translated name or original if not in Arabic mode
 */
export const getTranslatedName = (
  name: string | null | undefined,
  isRTL: boolean,
  translatedNames: { [key: string]: string },
  setTranslatedNames: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>
): string => {
  if (!name) return '';

  // Only translate names when interface is in Arabic mode
  if (!isRTL) {
    return name; // Return original name for English mode
  }

  // Check if we have a cached translation
  if (translatedNames[name]) {
    return translatedNames[name];
  }

  // For common names, use immediate translation without API call
  const upperName = name.toUpperCase();

  // Check if it's a simple name we can translate immediately
  const cleanName = upperName.replace(/[^A-Z\s]/g, '');
  if (nameMappings[cleanName]) {
    const translated = nameMappings[cleanName];
    setTranslatedNames(prev => ({ ...prev, [name]: translated }));
    return translated;
  }

  // For complex names, trigger background translation
  if (!translatedNames[name]) {
    // Add a flag to prevent multiple simultaneous API calls for the same name
    const translationKey = `translating_${name}`;
    if (!translatedNames[translationKey]) {
      translatedNames[translationKey] = 'translating';
      translateNameToArabic(name, isRTL).then(translated => {
        setTranslatedNames(prev => {
          const newState = { ...prev, [name]: translated };
          delete newState[translationKey]; // Clear the flag
          return newState;
        });
      }).catch(() => {
        // Clear the flag on error too
        setTranslatedNames(prev => {
          const newState = { ...prev };
          delete newState[translationKey]; // Clear the flag
          return newState;
        });
      });
    }
  }

  return name;
};

/**
 * Batch translate multiple names efficiently
 * @param names - Array of names to translate
 * @param isRTL - Whether the interface is in RTL (Arabic) mode
 * @param setTranslatedNames - State setter for caching translations
 */
export const batchTranslateNames = async (
  names: string[],
  isRTL: boolean,
  setTranslatedNames: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>
) => {
  if (!isRTL) return; // Don't translate in English mode

  // Check if we're currently rate limited
  if (isRateLimited) {
    if (Date.now() < rateLimitResetTime) {
      console.log('Translation rate limited, skipping batch translation');
      return;
    } else {
      // Reset rate limit status
      isRateLimited = false;
      rateLimitResetTime = 0;
    }
  }

  const uniqueNames = [...new Set(names.filter(Boolean))];
  const untranslatedNames = uniqueNames.filter(name => !translationCache.has(name));

  if (untranslatedNames.length === 0) return;

  // Process names in smaller batches with longer delays to respect rate limits
  const batchSize = 2; // Reduced from 5 to 2
  for (let i = 0; i < untranslatedNames.length; i += batchSize) {
    const batch = untranslatedNames.slice(i, i + batchSize);

    // Process batch sequentially instead of in parallel to avoid overwhelming the API
    for (const name of batch) {
      try {
        const translated = await translateNameToArabic(name, isRTL);
        setTranslatedNames(prev => ({
          ...prev,
          [name]: translated,
        }));
        
        // Add delay between individual translations
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn('Error translating name:', name, error);
      }
    }

    // Add longer delay between batches to be respectful to the API
    if (i + batchSize < untranslatedNames.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased from 100ms to 1000ms
    }
  }
};

/**
 * Clear translation cache (useful when switching languages)
 */
export const clearTranslationCache = () => {
  translationCache.clear();
  isRateLimited = false;
  rateLimitResetTime = 0;
};
