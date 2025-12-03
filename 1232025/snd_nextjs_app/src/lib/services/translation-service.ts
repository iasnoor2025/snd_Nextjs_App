/**
 * Translation Service
 * Handles automatic translation of chat messages between English and Arabic
 */

// Simple language detection
export function detectLanguage(text: string): 'en' | 'ar' {
  if (!text || text.trim().length === 0) return 'en';
  
  // Check for Arabic characters (Unicode range for Arabic script)
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const hasArabic = arabicPattern.test(text);
  
  // If text contains Arabic characters, it's Arabic
  if (hasArabic) return 'ar';
  
  // Otherwise, assume English
  return 'en';
}

// Translate text using API
export async function translateText(
  text: string,
  targetLang: 'en' | 'ar',
  sourceLang?: 'en' | 'ar'
): Promise<string> {
  if (!text || text.trim().length === 0) return text;

  // Detect source language if not provided
  const detectedSourceLang = sourceLang || detectLanguage(text);

  // If already in target language, return as-is
  if (detectedSourceLang === targetLang) {
    return text;
  }

  try {
    // Call translation API
    const response = await fetch('/api/chat/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error('Translation API error');
    }

    const result = await response.json();
    return result.data?.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text on error
    return text;
  }
}

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, string>();

export function getCachedTranslation(key: string): string | null {
  return translationCache.get(key) || null;
}

export function setCachedTranslation(key: string, translation: string): void {
  translationCache.set(key, translation);
}

export function getTranslationCacheKey(text: string, targetLang: 'en' | 'ar'): string {
  return `${text}:${targetLang}`;
}

