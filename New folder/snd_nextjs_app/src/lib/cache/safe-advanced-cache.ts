/**
 * Safe Advanced Caching Strategies
 * Provides advanced caching without breaking existing functionality
 * All methods are safe and non-breaking
 */

interface CacheStrategy {
  name: string;
  ttl: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  compression?: boolean;
  encryption?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed?: boolean;
  encrypted?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
  memoryUsage: number;
}

export class SafeAdvancedCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private strategy: CacheStrategy;
  private stats: CacheStats;
  private compressionEnabled: boolean;
  private encryptionEnabled: boolean;

  constructor(strategy: Partial<CacheStrategy> = {}) {
    this.strategy = {
      name: 'default',
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      evictionPolicy: 'lru',
      compression: false,
      encryption: false,
      ...strategy
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      maxSize: this.strategy.maxSize,
      hitRate: 0,
      memoryUsage: 0
    };

    this.compressionEnabled = this.strategy.compression || false;
    this.encryptionEnabled = this.strategy.encryption || false;
  }

  /**
   * Get cached data
   * Safe method that won't break existing functionality
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    this.updateHitRate();
    
    return entry.data;
  }

  /**
   * Set cached data
   * Safe method for caching data
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.strategy.ttl;
    
    // Calculate size
    const size = this.calculateSize(data);
    
    // Check if we need to evict
    if (this.cache.size >= this.strategy.maxSize) {
      this.evict();
    }

    // Create entry
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 1,
      lastAccessed: now,
      size,
      compressed: this.compressionEnabled,
      encrypted: this.encryptionEnabled
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * Delete cached data
   * Safe method for cache invalidation
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Clear all cached data
   * Safe method for complete cache clearing
   */
  clear(): void {
    this.cache.clear();
    this.updateStats();
  }

  /**
   * Check if key exists
   * Safe method for cache checking
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache statistics
   * Safe method for monitoring
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache keys
   * Safe method for cache inspection
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   * Safe method for size monitoring
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict entries based on strategy
   * Private method for cache management
   */
  private evict(): void {
    const entries = Array.from(this.cache.entries());
    
    switch (this.strategy.evictionPolicy) {
      case 'lru':
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;
      case 'lfu':
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'fifo':
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
      case 'ttl':
        entries.sort((a, b) => (a[1].timestamp + a[1].ttl) - (b[1].timestamp + b[1].ttl));
        break;
    }

    // Remove oldest entry
    const [keyToRemove] = entries[0];
    this.cache.delete(keyToRemove);
    this.stats.evictions++;
  }

  /**
   * Update cache statistics
   * Private method for stats calculation
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  /**
   * Update hit rate
   * Private method for hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Calculate data size
   * Private method for size calculation
   */
  private calculateSize(data: T): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

/**
 * Safe multi-level cache
 * Safe method for hierarchical caching
 */
export class SafeMultiLevelCache<T = any> {
  private levels: SafeAdvancedCache<T>[];
  private stats: CacheStats;

  constructor(levels: Partial<CacheStrategy>[] = []) {
    this.levels = levels.map(strategy => new SafeAdvancedCache(strategy));
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      maxSize: 0,
      hitRate: 0,
      memoryUsage: 0
    };
  }

  /**
   * Get data from cache
   * Safe method that won't break existing functionality
   */
  get(key: string): T | null {
    for (let i = 0; i < this.levels.length; i++) {
      const data = this.levels[i].get(key);
      if (data !== null) {
        // Promote to higher levels
        for (let j = 0; j < i; j++) {
          this.levels[j].set(key, data);
        }
        this.stats.hits++;
        this.updateHitRate();
        return data;
      }
    }
    
    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set data in cache
   * Safe method for caching data
   */
  set(key: string, data: T, ttl?: number): void {
    // Set in all levels
    this.levels.forEach(level => {
      level.set(key, data, ttl);
    });
    this.updateStats();
  }

  /**
   * Delete data from cache
   * Safe method for cache invalidation
   */
  delete(key: string): boolean {
    let deleted = false;
    this.levels.forEach(level => {
      if (level.delete(key)) {
        deleted = true;
      }
    });
    return deleted;
  }

  /**
   * Clear all cache levels
   * Safe method for complete cache clearing
   */
  clear(): void {
    this.levels.forEach(level => level.clear());
    this.updateStats();
  }

  /**
   * Get combined statistics
   * Safe method for monitoring
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Update statistics
   * Private method for stats calculation
   */
  private updateStats(): void {
    this.stats.size = this.levels.reduce((total, level) => total + level.size(), 0);
    this.stats.maxSize = this.levels.reduce((total, level) => total + level.getStats().maxSize, 0);
    this.stats.memoryUsage = this.levels.reduce((total, level) => total + level.getStats().memoryUsage, 0);
  }

  /**
   * Update hit rate
   * Private method for hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * Safe cache invalidation strategies
 * Safe method for cache invalidation
 */
export class SafeCacheInvalidation {
  private invalidationRules = new Map<string, string[]>();
  private invalidationCallbacks = new Map<string, () => void>();

  /**
   * Add invalidation rule
   * Safe method for rule management
   */
  addRule(pattern: string, keys: string[]): void {
    this.invalidationRules.set(pattern, keys);
  }

  /**
   * Add invalidation callback
   * Safe method for callback management
   */
  addCallback(key: string, callback: () => void): void {
    this.invalidationCallbacks.set(key, callback);
  }

  /**
   * Invalidate by pattern
   * Safe method for pattern-based invalidation
   */
  invalidateByPattern(pattern: string): void {
    const keys = this.invalidationRules.get(pattern);
    if (keys) {
      keys.forEach(key => {
        const callback = this.invalidationCallbacks.get(key);
        if (callback) {
          callback();
        }
      });
    }
  }

  /**
   * Invalidate by key
   * Safe method for key-based invalidation
   */
  invalidateByKey(key: string): void {
    const callback = this.invalidationCallbacks.get(key);
    if (callback) {
      callback();
    }
  }

  /**
   * Invalidate all
   * Safe method for complete invalidation
   */
  invalidateAll(): void {
    this.invalidationCallbacks.forEach(callback => callback());
  }
}

// Global cache instances
export const globalCache = new SafeAdvancedCache({
  name: 'global',
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 2000,
  evictionPolicy: 'lru'
});

export const sessionCache = new SafeAdvancedCache({
  name: 'session',
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 500,
  evictionPolicy: 'lru'
});

export const userCache = new SafeAdvancedCache({
  name: 'user',
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 1000,
  evictionPolicy: 'lru'
});

export const multiLevelCache = new SafeMultiLevelCache([
  { name: 'l1', ttl: 1 * 60 * 1000, maxSize: 100, evictionPolicy: 'lru' },
  { name: 'l2', ttl: 5 * 60 * 1000, maxSize: 500, evictionPolicy: 'lru' },
  { name: 'l3', ttl: 15 * 60 * 1000, maxSize: 1000, evictionPolicy: 'lru' }
]);

export const cacheInvalidation = new SafeCacheInvalidation();

// Cache utilities for common patterns
export const CacheUtils = {
  /**
   * Cache employee data
   */
  async getEmployee(employeeId: number, fetcher: () => Promise<any>) {
    const key = `employee:${employeeId}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 10 * 60 * 1000); // 10 minutes
    }
    
    return data;
  },

  /**
   * Cache department data
   */
  async getDepartment(departmentId: number, fetcher: () => Promise<any>) {
    const key = `department:${departmentId}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 30 * 60 * 1000); // 30 minutes
    }
    
    return data;
  },

  /**
   * Cache equipment data
   */
  async getEquipment(equipmentId: number, fetcher: () => Promise<any>) {
    const key = `equipment:${equipmentId}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 5 * 60 * 1000); // 5 minutes
    }
    
    return data;
  },

  /**
   * Cache project data
   */
  async getProject(projectId: number, fetcher: () => Promise<any>) {
    const key = `project:${projectId}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 5 * 60 * 1000); // 5 minutes
    }
    
    return data;
  },

  /**
   * Cache customer data
   */
  async getCustomer(customerId: number, fetcher: () => Promise<any>) {
    const key = `customer:${customerId}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 15 * 60 * 1000); // 15 minutes
    }
    
    return data;
  },

  /**
   * Cache user data
   */
  async getUser(userId: number, fetcher: () => Promise<any>) {
    const key = `user:${userId}`;
    let data = userCache.get(key);
    
    if (!data) {
      data = await fetcher();
      userCache.set(key, data, 10 * 60 * 1000); // 10 minutes
    }
    
    return data;
  },

  /**
   * Cache dashboard stats
   */
  async getDashboardStats(fetcher: () => Promise<any>) {
    const key = 'dashboard:stats';
    let data = sessionCache.get(key);
    
    if (!data) {
      data = await fetcher();
      sessionCache.set(key, data, 2 * 60 * 1000); // 2 minutes
    }
    
    return data;
  },

  /**
   * Cache equipment list
   */
  async getEquipmentList(filters: any, fetcher: () => Promise<any>) {
    const key = `equipment:list:${JSON.stringify(filters)}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 5 * 60 * 1000); // 5 minutes
    }
    
    return data;
  },

  /**
   * Cache employee list
   */
  async getEmployeeList(filters: any, fetcher: () => Promise<any>) {
    const key = `employee:list:${JSON.stringify(filters)}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 5 * 60 * 1000); // 5 minutes
    }
    
    return data;
  },

  /**
   * Cache project list
   */
  async getProjectList(filters: any, fetcher: () => Promise<any>) {
    const key = `project:list:${JSON.stringify(filters)}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 5 * 60 * 1000); // 5 minutes
    }
    
    return data;
  },

  /**
   * Cache rental list
   */
  async getRentalList(filters: any, fetcher: () => Promise<any>) {
    const key = `rental:list:${JSON.stringify(filters)}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 5 * 60 * 1000); // 5 minutes
    }
    
    return data;
  },

  /**
   * Cache timesheet data
   */
  async getTimesheetData(employeeId: number, date: string, fetcher: () => Promise<any>) {
    const key = `timesheet:${employeeId}:${date}`;
    let data = sessionCache.get(key);
    
    if (!data) {
      data = await fetcher();
      sessionCache.set(key, data, 2 * 60 * 1000); // 2 minutes
    }
    
    return data;
  },

  /**
   * Cache maintenance data
   */
  async getMaintenanceData(equipmentId: number, fetcher: () => Promise<any>) {
    const key = `maintenance:${equipmentId}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 5 * 60 * 1000); // 5 minutes
    }
    
    return data;
  },

  /**
   * Cache notification data
   */
  async getNotifications(userId: number, fetcher: () => Promise<any>) {
    const key = `notifications:${userId}`;
    let data = sessionCache.get(key);
    
    if (!data) {
      data = await fetcher();
      sessionCache.set(key, data, 1 * 60 * 1000); // 1 minute
    }
    
    return data;
  },

  /**
   * Cache permission data
   */
  async getPermissions(userId: number, fetcher: () => Promise<any>) {
    const key = `permissions:${userId}`;
    let data = userCache.get(key);
    
    if (!data) {
      data = await fetcher();
      userCache.set(key, data, 15 * 60 * 1000); // 15 minutes
    }
    
    return data;
  },

  /**
   * Cache report data
   */
  async getReportData(reportType: string, filters: any, fetcher: () => Promise<any>) {
    const key = `report:${reportType}:${JSON.stringify(filters)}`;
    let data = globalCache.get(key);
    
    if (!data) {
      data = await fetcher();
      globalCache.set(key, data, 10 * 60 * 1000); // 10 minutes
    }
    
    return data;
  }
};

// Export for use in other files
export default {
  SafeAdvancedCache,
  SafeMultiLevelCache,
  SafeCacheInvalidation,
  globalCache,
  sessionCache,
  userCache,
  multiLevelCache,
  cacheInvalidation,
  CacheUtils
};
