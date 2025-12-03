import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

class APICacheMiddleware {
  private cache = new Map<string, CacheEntry>();
  
  get(key: string, ttl: number = 60000): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
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

export const apiCacheMiddleware = new APICacheMiddleware();

// Helper function to create cacheable route handlers
export function withCache<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    ttl?: number;
    getCacheKey: (request: NextRequest, context?: any) => string;
    skipCache?: (request: NextRequest, context?: any) => boolean;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const { ttl = 30000, getCacheKey, skipCache } = options;
    
    // Skip cache if requested
    if (skipCache && skipCache(request, context)) {
      return handler(request, context);
    }
    
    // Check cache
    const cacheKey = getCacheKey(request, context);
    const cached = apiCacheMiddleware.get(cacheKey, ttl);
    
    if (cached) {
      return NextResponse.json(cached);
    }
    
    // Execute handler
    const response = await handler(request, context);
    
    // Clone response to cache
    const clonedResponse = response.clone();
    try {
      const data = await clonedResponse.json();
      apiCacheMiddleware.set(cacheKey, data);
    } catch (e) {
      // Not JSON, don't cache
    }
    
    return response;
  };
}

// Helper to create simple cache key from URL and params
export function getSimpleCacheKey(request: NextRequest): string {
  const url = new URL(request.url);
  return `${url.pathname}${url.search}`;
}

