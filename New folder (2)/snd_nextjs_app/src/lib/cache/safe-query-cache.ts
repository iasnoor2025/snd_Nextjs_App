/**
 * Safe Query Cache Service
 * Provides intelligent caching for database queries without breaking existing functionality
 * All methods are safe and non-breaking
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class SafeQueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Prevent memory leaks
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data or fetch fresh data
   * Safe method that won't break existing functionality
   */
  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Fetch fresh data
    try {
      const data = await fetcher();
      
      // Store in cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });

      // Cleanup if cache is too large
      this.cleanup();

      return data;
    } catch (error) {
      // If fetch fails, return cached data if available
      if (cached) {
        console.warn(`Cache fallback for key ${key}:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Set cache entry manually
   * Safe method for manual cache management
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.cleanup();
  }

  /**
   * Get cached data without fetching
   * Safe method for checking cache only
   */
  getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }

  /**
   * Invalidate cache entry
   * Safe method for cache invalidation
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries by pattern
   * Safe method for pattern-based invalidation
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   * Safe method for complete cache clearing
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * Safe method for monitoring cache performance
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for accurate rate
      entries
    };
  }

  /**
   * Cleanup expired entries and enforce size limit
   * Private method for internal cache management
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }

    // Enforce size limit (remove oldest entries)
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.maxSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Create cache key from parameters
   * Safe utility method for consistent key generation
   */
  static createKey(prefix: string, ...params: any[]): string {
    return `${prefix}:${params.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':')}`;
  }
}

// Global cache instance
export const queryCache = new SafeQueryCache();

// Cache decorator for methods (optional, safe to use)
export function cached(ttl: number = 5 * 60 * 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = SafeQueryCache.createKey(`${target.constructor.name}.${propertyName}`, ...args);
      
      return queryCache.get(key, () => method.apply(this, args), ttl);
    };
    
    return descriptor;
  };
}

// Cache utilities for common patterns
export const CacheUtils = {
  /**
   * Cache employee data
   */
  async getEmployee(employeeId: number, fetcher: () => Promise<any>) {
    return queryCache.get(
      `employee:${employeeId}`,
      fetcher,
      10 * 60 * 1000 // 10 minutes
    );
  },

  /**
   * Cache department data
   */
  async getDepartment(departmentId: number, fetcher: () => Promise<any>) {
    return queryCache.get(
      `department:${departmentId}`,
      fetcher,
      30 * 60 * 1000 // 30 minutes
    );
  },

  /**
   * Cache equipment data
   */
  async getEquipment(equipmentId: number, fetcher: () => Promise<any>) {
    return queryCache.get(
      `equipment:${equipmentId}`,
      fetcher,
      5 * 60 * 1000 // 5 minutes
    );
  },

  /**
   * Cache project data
   */
  async getProject(projectId: number, fetcher: () => Promise<any>) {
    return queryCache.get(
      `project:${projectId}`,
      fetcher,
      5 * 60 * 1000 // 5 minutes
    );
  },

  /**
   * Cache customer data
   */
  async getCustomer(customerId: number, fetcher: () => Promise<any>) {
    return queryCache.get(
      `customer:${customerId}`,
      fetcher,
      15 * 60 * 1000 // 15 minutes
    );
  },

  /**
   * Cache user data
   */
  async getUser(userId: number, fetcher: () => Promise<any>) {
    return queryCache.get(
      `user:${userId}`,
      fetcher,
      10 * 60 * 1000 // 10 minutes
    );
  },

  /**
   * Cache dashboard stats
   */
  async getDashboardStats(fetcher: () => Promise<any>) {
    return queryCache.get(
      'dashboard:stats',
      fetcher,
      2 * 60 * 1000 // 2 minutes
    );
  },

  /**
   * Cache equipment list
   */
  async getEquipmentList(filters: any, fetcher: () => Promise<any>) {
    const key = SafeQueryCache.createKey('equipment:list', filters);
    return queryCache.get(key, fetcher, 5 * 60 * 1000);
  },

  /**
   * Cache employee list
   */
  async getEmployeeList(filters: any, fetcher: () => Promise<any>) {
    const key = SafeQueryCache.createKey('employee:list', filters);
    return queryCache.get(key, fetcher, 5 * 60 * 1000);
  },

  /**
   * Cache project list
   */
  async getProjectList(filters: any, fetcher: () => Promise<any>) {
    const key = SafeQueryCache.createKey('project:list', filters);
    return queryCache.get(key, fetcher, 5 * 60 * 1000);
  },

  /**
   * Cache rental list
   */
  async getRentalList(filters: any, fetcher: () => Promise<any>) {
    const key = SafeQueryCache.createKey('rental:list', filters);
    return queryCache.get(key, fetcher, 5 * 60 * 1000);
  },

  /**
   * Cache timesheet data
   */
  async getTimesheetData(employeeId: number, date: string, fetcher: () => Promise<any>) {
    const key = SafeQueryCache.createKey('timesheet', employeeId, date);
    return queryCache.get(key, fetcher, 2 * 60 * 1000); // 2 minutes
  },

  /**
   * Cache maintenance data
   */
  async getMaintenanceData(equipmentId: number, fetcher: () => Promise<any>) {
    return queryCache.get(
      `maintenance:${equipmentId}`,
      fetcher,
      5 * 60 * 1000 // 5 minutes
    );
  },

  /**
   * Cache notification data
   */
  async getNotifications(userId: number, fetcher: () => Promise<any>) {
    return queryCache.get(
      `notifications:${userId}`,
      fetcher,
      1 * 60 * 1000 // 1 minute
    );
  },

  /**
   * Cache permission data
   */
  async getPermissions(userId: number, fetcher: () => Promise<any>) {
    return queryCache.get(
      `permissions:${userId}`,
      fetcher,
      15 * 60 * 1000 // 15 minutes
    );
  },

  /**
   * Cache report data
   */
  async getReportData(reportType: string, filters: any, fetcher: () => Promise<any>) {
    const key = SafeQueryCache.createKey('report', reportType, filters);
    return queryCache.get(key, fetcher, 10 * 60 * 1000); // 10 minutes
  }
};

// Export for use in other files
export default queryCache;
