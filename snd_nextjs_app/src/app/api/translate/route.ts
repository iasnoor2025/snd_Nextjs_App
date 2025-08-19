import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for translations
const translationCache = new Map<string, string>();

export async function POST(_request: NextRequest) {
  try {
    const { text, targetLanguage } = await _request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Text and target language are required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `${text}_${targetLanguage}`;
    if (translationCache.has(cacheKey)) {
      return NextResponse.json({
        translatedText: translationCache.get(cacheKey),
        originalText: text,
        targetLang: targetLanguage,
        cached: true,
      });
    }

    // Google Translate API endpoint

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
        target: targetLanguage,
        format: 'text',
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const translatedText = result.translatedText || text;

      // Cache the result
      translationCache.set(cacheKey, translatedText);

      return NextResponse.json({
        translatedText: translatedText,
        originalText: text,
        targetLang: targetLanguage,
      });
    } else {
      // Fallback: return original text if translation fails
      return NextResponse.json({
        translatedText: text,
        originalText: text,
        targetLang: targetLanguage,
        note: 'Translation service unavailable, using original text',
      });
    }
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Translation failed',
        translatedText: '',
        originalText: '',
      },
      { status: 500 }
    );
  }
}
