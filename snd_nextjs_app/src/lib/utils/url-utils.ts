/**
 * URL utilities to ensure HTTPS URLs and prevent Mixed Content errors
 */

/**
 * Forces a URL to use HTTPS, replacing any HTTP protocol
 * This is critical for preventing Mixed Content errors in production
 */
export function ensureHttps(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return url || '';
  
  // Replace http:// with https://
  let secureUrl = url.replace(/^http:/, 'https:');
  
  // Double-check and force HTTPS if still contains HTTP
  if (secureUrl.includes('http://')) {
    secureUrl = secureUrl.replace(/^http:/, 'https:');
  }
  
  return secureUrl;
}

/**
 * Checks if a URL is secure (HTTPS)
 */
export function isSecureUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('https://');
}

/**
 * Converts any URL to a secure HTTPS URL
 * Useful for production environments where HTTP URLs might be cached
 */
export function forceSecureUrl(url: string): string {
  if (!url) return url;
  
  // If it's already HTTPS, return as is
  if (url.startsWith('https://')) {
    return url;
  }
  
  // If it's HTTP, convert to HTTPS
  if (url.startsWith('http://')) {
    return url.replace(/^http:/, 'https:');
  }
  
  // If it's a relative URL or doesn't have protocol, assume HTTPS
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // For relative URLs, return as is (they'll use the current protocol)
  return url;
}

/**
 * Batch process multiple URLs to ensure they're all HTTPS
 */
export function ensureHttpsBatch(urls: string[]): string[] {
  return urls.map(url => ensureHttps(url));
}

/**
 * Logs URL conversion for debugging (only in development)
 */
export function logUrlConversion(originalUrl: string, secureUrl: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('URL Conversion:', { original: originalUrl, secure: secureUrl });
  }
}
