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
    // Option 1: Use Google Translate API (if API key is provided)
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      try {
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
          if (googleData.data?.translations?.[0]?.translatedText) {
            return googleData.data.translations[0].translatedText;
          }
        } else {
          const errorData = await googleResponse.json().catch(() => ({}));
          console.error('Google Translate API error:', googleResponse.status, errorData);
        }
      } catch (googleError) {
        console.error('Google Translate API request failed:', googleError);
      }
    }

    // Option 2: Use LibreTranslate (free, open-source, self-hosted or public instance)
    // Public instance: https://libretranslate.com (rate limited, may not work)
    const libreTranslateUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate';
    
    try {
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
        if (data.translatedText) {
          return data.translatedText;
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('LibreTranslate API error:', response.status, errorText);
      }
    } catch (libreError) {
      console.error('LibreTranslate request failed:', libreError);
    }

    // If all translation services fail, return original text
    console.warn('Translation service unavailable. To enable translation, set GOOGLE_TRANSLATE_API_KEY or LIBRETRANSLATE_URL in .env.local');
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

    const detectedLang = detectLanguage(text);
    
    // If already in target language, return as-is
    if (detectedLang === targetLang) {
      return NextResponse.json({
        success: true,
        data: {
          originalText: text,
          translatedText: text,
          sourceLanguage: detectedLang,
          targetLanguage: targetLang,
          note: 'Text is already in target language',
        },
      });
    }

    const translated = await translateText(text, targetLang);
    const wasTranslated = translated !== text;

    return NextResponse.json({
      success: true,
      data: {
        originalText: text,
        translatedText: translated,
        sourceLanguage: detectedLang,
        targetLanguage: targetLang,
        wasTranslated,
        note: wasTranslated 
          ? 'Translation successful' 
          : 'Translation service not configured. Please set GOOGLE_TRANSLATE_API_KEY or LIBRETRANSLATE_URL in .env.local',
      },
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

