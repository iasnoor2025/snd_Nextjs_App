import { redisService } from './index';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for organization
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheResult<T> {
  data: T;
  cached: boolean;
  timestamp: number;
}

export class CacheService {
  private defaultTTL = 300; // 5 minutes default
  private keyPrefix = 'app:';

  /**
   * Check if Redis is available
   */
  private isRedisAvailable(): boolean {
    return !redisService.isRedisDisabled() && redisService.isClientConnected();
  }

  /**
   * Generate a cache key from components
   */
  private generateKey(components: (string | number | boolean)[]): string {
    return `${this.keyPrefix}${components.join(':')}`;
  }

  /**
   * Set a value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    // Skip caching if Redis is disabled
    if (!this.isRedisAvailable()) {
      return;
    }

    try {
      const client = redisService.getClient();
      const ttl = options.ttl || this.defaultTTL;
      const fullKey = this.generateKey([options.prefix || 'data', key]);

      const cacheData: CacheResult<T> = {
        data: value,
        cached: true,
        timestamp: Date.now(),
      };

      await client.setEx(fullKey, ttl, JSON.stringify(cacheData));

      // Store tags for invalidation if provided
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(fullKey, options.tags);
      }
    } catch (error) {
      console.error('Cache set error:', error);
      // Don't throw - caching failures shouldn't break the app
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    // Return null if Redis is disabled
    if (!this.isRedisAvailable()) {
      return null;
    }

    try {
      const client = redisService.getClient();
      const fullKey = this.generateKey([prefix || 'data', key]);

      const cached = await client.get(fullKey);
      if (!cached) return null;

      const parsed: CacheResult<T> = JSON.parse(cached);
      return parsed.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Get or set cache (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // If Redis is disabled, just fetch fresh data
    if (!this.isRedisAvailable()) {
      return await fetchFn();
    }

    // Try to get from cache first
    const cached = await this.get<T>(key, options.prefix);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const freshData = await fetchFn();
    
    // Cache the fresh data
    await this.set(key, freshData, options);
    
    return freshData;
  }

  /**
   * Delete a specific cache key
   */
  async delete(key: string, prefix?: string): Promise<void> {
    try {
      const client = redisService.getClient();
      const fullKey = this.generateKey([prefix || 'data', key]);
      await client.del(fullKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache with a specific prefix
   */
  async clearPrefix(prefix: string): Promise<void> {
    try {
      const client = redisService.getClient();
      const pattern = `${this.keyPrefix}${prefix}:*`;
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Cache clear prefix error:', error);
    }
  }

  /**
   * Clear cache by tags
   */
  async clearByTags(tags: string[]): Promise<void> {
    try {
      const client = redisService.getClient();
      
      for (const tag of tags) {
        const tagKey = `${this.keyPrefix}tag:${tag}`;
        const keys = await client.sMembers(tagKey);
        
        if (keys.length > 0) {
          await client.del(keys);
          await client.del(tagKey);
        }
      }
    } catch (error) {
      console.error('Cache clear by tags error:', error);
    }
  }

  /**
   * Invalidate cache by tag (alias for clearByTags)
   */
  async invalidateCacheByTag(tag: string): Promise<void> {
    await this.clearByTags([tag]);
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      const client = redisService.getClient();
      const keys = await client.keys(`${this.keyPrefix}*`);
      
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Cache clear all error:', error);
    }
  }

  /**
   * Store cache tags for invalidation
   */
  private async storeTags(key: string, tags: string[]): Promise<void> {
    try {
      const client = redisService.getClient();
      
      for (const tag of tags) {
        const tagKey = `${this.keyPrefix}tag:${tag}`;
        await client.sAdd(tagKey, key);
        // Set TTL on tag set (longer than data TTL)
        await client.expire(tagKey, 86400); // 24 hours
      }
    } catch (error) {
      console.error('Store tags error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    connected: boolean;
  }> {
    try {
      const client = redisService.getClient();
      const info = await client.info('memory');
      const keys = await client.dbSize();
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memory = memoryMatch ? memoryMatch[1] || 'Unknown' : 'Unknown';
      
      return {
        keys,
        memory,
        connected: redisService.isClientConnected(),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        keys: 0,
        memory: 'Unknown',
        connected: false,
      };
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
