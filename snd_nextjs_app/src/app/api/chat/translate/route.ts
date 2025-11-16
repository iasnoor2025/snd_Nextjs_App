import { NextRequest, NextResponse } from 'next/server';

// Simple language detection and translation
// For production, you should use a proper translation service like Google Translate API

function detectLanguage(text: string): 'en' | 'ar' {
  if (!text || text.trim().length === 0) return 'en';
  
  // Check for Arabic characters (Unicode range for Arabic script)
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text) ? 'ar' : 'en';
}

// Translation function using LibreTranslate (free, open-source)
// You can replace this with Google Translate API, Azure Translator, etc.
async function translateText(text: string, targetLang: 'en' | 'ar'): Promise<string> {
  const sourceLang = detectLanguage(text);
  
  // If already in target language, return as-is
  if (sourceLang === targetLang) {
    return text;
  }

  try {
    // Option 1: Use LibreTranslate (free, open-source, self-hosted or public instance)
    // Public instance: https://libretranslate.com (rate limited)
    const libreTranslateUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate';
    
    const response = await fetch(libreTranslateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.translatedText || text;
    }

    // Fallback: If LibreTranslate fails, try Google Translate (requires API key)
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      const googleResponse = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: sourceLang,
            target: targetLang,
          }),
        }
      );
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        return googleData.data.translations[0].translatedText;
      }
    }

    // If all translation services fail, return original text
    console.warn('Translation service unavailable, returning original text');
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original on error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!targetLang || !['en', 'ar'].includes(targetLang)) {
      return NextResponse.json({ error: 'Valid target language (en/ar) is required' }, { status: 400 });
    }

    const translated = await translateText(text, targetLang);
    const detectedLang = detectLanguage(text);

    return NextResponse.json({
      success: true,
      data: {
        originalText: text,
        translatedText: translated,
        sourceLanguage: detectedLang,
        targetLanguage: targetLang,
      },
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

