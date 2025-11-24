import { useCallback, useMemo } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // Limit cache size to prevent memory leaks

  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes TTL
    // Clean up expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // If still full after cleanup, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const entriesToRemove = sortedEntries.slice(0, Math.floor(this.maxSize * 0.2));
      entriesToRemove.forEach(([key]) => this.cache.delete(key));
    }
  }
}

const globalCache = new PerformanceCache();

export function usePerformanceCache() {
  const set = useCallback(<T>(key: string, data: T, ttl?: number) => {
    globalCache.set(key, data, ttl);
  }, []);

  const get = useCallback(<T>(key: string): T | null => {
    return globalCache.get<T>(key);
  }, []);

  const has = useCallback((key: string): boolean => {
    return globalCache.has(key);
  }, []);

  const remove = useCallback((key: string) => {
    globalCache.delete(key);
  }, []);

  const clear = useCallback(() => {
    globalCache.clear();
  }, []);

  // Memoized cache interface
  const cacheInterface = useMemo(() => ({
    set,
    get,
    has,
    remove,
    clear,
  }), [set, get, has, remove, clear]);

  return cacheInterface;
}

// Hook for memoizing API calls with cache
export function useCachedFetch() {
  const cache = usePerformanceCache();

  const cachedFetch = useCallback(async <T>(
    url: string,
    options?: RequestInit,
    ttl: number = 300000 // 5 minutes default
  ): Promise<T> => {
    const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch data
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    cache.set(cacheKey, data, ttl);
    
    return data;
  }, [cache]);

  return cachedFetch;
}
