# Translation Setup Guide

The chat system supports automatic translation between English and Arabic. To enable translation, you need to configure one of the following translation services:

## Option 1: Google Translate API (Recommended)

Google Translate API provides reliable, high-quality translations with generous free tier.

### Setup Steps:

1. **Get Google Cloud API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Cloud Translation API"
   - Go to "Credentials" and create an API key
   - Copy the API key

2. **Add to Environment Variables:**
   Add this to your `.env.local` file:
   ```bash
   GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

### Pricing:
- Free tier: 500,000 characters per month
- After free tier: $20 per 1 million characters

## Option 2: LibreTranslate (Self-Hosted)

LibreTranslate is a free, open-source translation service that you can self-host.

### Setup Steps:

1. **Install LibreTranslate:**
   ```bash
   # Using Docker (recommended)
   docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
   ```

2. **Add to Environment Variables:**
   Add this to your `.env.local` file:
   ```bash
   LIBRETRANSLATE_URL=http://localhost:5000/translate
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

### Alternative: Use Public Instance (Not Recommended)
The public LibreTranslate instance (https://libretranslate.com) is rate-limited and may not work reliably. For production, use self-hosted or Google Translate API.

## Option 3: No Translation Service

If you don't configure any translation service, the chat will still work but messages won't be automatically translated. Users will see messages in their original language.

## Testing Translation

1. Open the chat interface
2. Send a message in Arabic (if your locale is English) or English (if your locale is Arabic)
3. The message should automatically show a translation option
4. Click "Show original" or "Show translation" to toggle between languages

## Troubleshooting

### Translation not working:
1. Check browser console for errors
2. Verify environment variables are set correctly in `.env.local`
3. Restart the development server after adding environment variables
4. Check API key permissions (for Google Translate)
5. Verify LibreTranslate server is running (if using self-hosted)

### Common Errors:
- **"Translation service unavailable"**: No translation service is configured
- **"Translation API error"**: Check API key or service URL
- **Rate limit errors**: You've exceeded the free tier limits (Google) or public instance limits (LibreTranslate)

## Environment Variables Summary

Add to `.env.local`:

```bash
# Option 1: Google Translate API (Recommended)
GOOGLE_TRANSLATE_API_KEY=your_api_key_here

# OR Option 2: Self-hosted LibreTranslate
LIBRETRANSLATE_URL=http://localhost:5000/translate

# Note: If both are set, Google Translate will be used first
```

