// Simple in-memory cache for API responses with TTL
class APICache {
  private cache = new Map<string, { data: any; expires: number }>();
  private defaultTTL = 60000; // 1 minute default

  set(key: string, data: any, ttl = this.defaultTTL): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new APICache();

// Helper function to create cache keys
export function createCacheKey(endpoint: string, params?: Record<string, any>): string {
  const sortedParams = params ? Object.keys(params).sort().map(key => `${key}:${params[key]}`).join('&') : '';
  return `${endpoint}${sortedParams ? '?' + sortedParams : ''}`;
}

