import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for translations
const translationCache = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang = 'ar' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `${text}_${targetLang}`;
    if (translationCache.has(cacheKey)) {
      return NextResponse.json({ 
        translatedText: translationCache.get(cacheKey),
        originalText: text,
        targetLang: targetLang,
        cached: true
      });
    }

    // Google Translate API endpoint
    const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
    
    // You'll need to set up Google Cloud Translation API and get an API key
    // For now, we'll use a free alternative or you can implement your own translation service
    
    // Option 1: Use LibreTranslate (free, self-hosted option)
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text'
      })
    });

    if (response.ok) {
      const result = await response.json();
      const translatedText = result.translatedText || text;
      
      // Cache the result
      translationCache.set(cacheKey, translatedText);
      
      return NextResponse.json({ 
        translatedText: translatedText,
        originalText: text,
        targetLang: targetLang
      });
    } else {
      // Fallback: return original text if translation fails
      return NextResponse.json({ 
        translatedText: text,
        originalText: text,
        targetLang: targetLang,
        note: 'Translation service unavailable, using original text'
      });
    }

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ 
      error: 'Translation failed',
      translatedText: '',
      originalText: ''
    }, { status: 500 });
  }
} 