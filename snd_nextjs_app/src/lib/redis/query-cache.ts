import { cacheService, CacheOptions } from './cache-service';

export interface QueryCacheOptions extends CacheOptions {
  key?: string; // Custom cache key
  invalidateOn?: string[]; // Tags to invalidate when this cache is updated
  skipCache?: boolean; // Skip caching for this query
}

/**
 * Decorator for caching database query results
 * Usage: @cacheQuery({ ttl: 600, tags: ['users'] })
 */
export function cacheQuery(options: QueryCacheOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Skip caching if requested
      if (options.skipCache) {
        return method.apply(this, args);
      }

      // Generate cache key
      const cacheKey = options.key || `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey, options.prefix);
      if (cached !== null) {
        return cached;
      }

      // Execute the original method
      const result = await method.apply(this, args);
      
      // Cache the result
      await cacheService.set(cacheKey, result, options);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Higher-order function for caching async functions
 */
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: QueryCacheOptions = {}
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    if (options.skipCache) {
      return fn(...args);
    }

    const cacheKey = options.key || `${fn.name}:${JSON.stringify(args)}`;
    
    return cacheService.getOrSet(
      cacheKey,
      () => fn(...args),
      options
    );
  };
}

/**
 * Cache a database query with automatic invalidation
 */
export async function cacheQueryResult<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: QueryCacheOptions = {}
): Promise<T> {
  return cacheService.getOrSet(key, queryFn, options);
}

/**
 * Invalidate cache by tags (useful after database updates)
 */
export async function invalidateCache(tags: string[]): Promise<void> {
  await cacheService.clearByTags(tags);
}

/**
 * Invalidate cache by prefix (useful for specific data types)
 */
export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  await cacheService.clearPrefix(prefix);
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  await cacheService.clearAll();
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  return cacheService.getStats();
}

/**
 * Utility for generating cache keys from database query parameters
 */
export function generateCacheKey(
  table: string,
  operation: string,
  params: Record<string, any> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':');
  
  return `${table}:${operation}:${sortedParams}`;
}

/**
 * Common cache tags for different data types
 */
export const CACHE_TAGS = {
  USERS: 'users',
  EMPLOYEES: 'employees',
  CUSTOMERS: 'customers',
  EQUIPMENT: 'equipment',
  RENTALS: 'rentals',
  DASHBOARD: 'dashboard',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
} as const;

/**
 * Common cache prefixes for different data types
 */
export const CACHE_PREFIXES = {
  USERS: 'users',
  EMPLOYEES: 'employees',
  CUSTOMERS: 'customers',
  EQUIPMENT: 'equipment',
  RENTALS: 'rentals',
  DASHBOARD: 'dashboard',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
} as const;
