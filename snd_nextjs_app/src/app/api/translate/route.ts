import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for translations
const translationCache = new Map<string, string>();

// Rate limiting to prevent excessive API calls
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 15; // Reduced from 30 to 15
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function POST(_request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = _request.headers.get('x-forwarded-for') || _request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    
    if (!requestCounts.has(clientIP)) {
      requestCounts.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else {
      const clientData = requestCounts.get(clientIP)!;
      if (now > clientData.resetTime) {
        // Reset window
        requestCounts.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      } else if (clientData.count >= MAX_REQUESTS_PER_MINUTE) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }, { status: 429 });
      } else {
        clientData.count++;
      }
    }

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
    console.error('Translation API error:', error);
    return NextResponse.json(
      {
        error: 'Translation failed',
        translatedText: '',
        originalText: '',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
