/**
 * Safe Performance Monitoring Service
 * Provides performance tracking without breaking existing functionality
 * All methods are safe and non-breaking
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  average: number;
  min: number;
  max: number;
  count: number;
  lastValue: number;
}

export class SafePerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric[]>();
  private maxMetricsPerType = 1000; // Prevent memory leaks
  private isEnabled = true;

  /**
   * Track a performance metric
   * Safe method that won't break existing functionality
   */
  track(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    try {
      const metric: PerformanceMetric = {
        name,
        value,
        timestamp: Date.now(),
        metadata
      };

      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }

      const metrics = this.metrics.get(name)!;
      metrics.push(metric);

      // Keep only recent metrics
      if (metrics.length > this.maxMetricsPerType) {
        metrics.splice(0, metrics.length - this.maxMetricsPerType);
      }
    } catch (error) {
      // Silently fail to avoid breaking functionality
      console.warn('Performance tracking failed:', error);
    }
  }

  /**
   * Track API response time
   * Safe method for API performance tracking
   */
  trackApiResponse(endpoint: string, method: string, duration: number, statusCode: number): void {
    this.track('api_response', duration, {
      endpoint,
      method,
      statusCode
    });
  }

  /**
   * Track database query time
   * Safe method for database performance tracking
   */
  trackDatabaseQuery(query: string, duration: number, rowCount?: number): void {
    this.track('database_query', duration, {
      query: query.substring(0, 100), // Truncate long queries
      rowCount
    });
  }

  /**
   * Track page load time
   * Safe method for page performance tracking
   */
  trackPageLoad(page: string, duration: number): void {
    this.track('page_load', duration, { page });
  }

  /**
   * Track component render time
   * Safe method for component performance tracking
   */
  trackComponentRender(component: string, duration: number): void {
    this.track('component_render', duration, { component });
  }

  /**
   * Track cache hit/miss
   * Safe method for cache performance tracking
   */
  trackCacheHit(key: string, hit: boolean, duration: number): void {
    this.track('cache_access', duration, {
      key: key.substring(0, 50), // Truncate long keys
      hit
    });
  }

  /**
   * Get performance statistics for a metric
   * Safe method for performance analysis
   */
  getStats(name: string): PerformanceStats | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      average: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      lastValue: values[values.length - 1]
    };
  }

  /**
   * Get all performance statistics
   * Safe method for comprehensive performance analysis
   */
  getAllStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};
    
    for (const [name] of this.metrics) {
      const stat = this.getStats(name);
      if (stat) {
        stats[name] = stat;
      }
    }

    return stats;
  }

  /**
   * Get recent metrics for a specific type
   * Safe method for detailed performance analysis
   */
  getRecentMetrics(name: string, limit: number = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(name);
    if (!metrics) return [];

    return metrics.slice(-limit);
  }

  /**
   * Clear metrics for a specific type
   * Safe method for metric cleanup
   */
  clearMetrics(name: string): void {
    this.metrics.delete(name);
  }

  /**
   * Clear all metrics
   * Safe method for complete metric cleanup
   */
  clearAllMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Enable/disable performance monitoring
   * Safe method for controlling monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if monitoring is enabled
   * Safe method for status checking
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get performance summary
   * Safe method for performance overview
   */
  getSummary(): {
    totalMetrics: number;
    metricTypes: string[];
    averageApiResponse: number;
    averageDatabaseQuery: number;
    averagePageLoad: number;
    cacheHitRate: number;
  } {
    const apiStats = this.getStats('api_response');
    const dbStats = this.getStats('database_query');
    const pageStats = this.getStats('page_load');
    const cacheStats = this.getStats('cache_access');

    // Calculate cache hit rate
    const cacheMetrics = this.getRecentMetrics('cache_access', 1000);
    const hits = cacheMetrics.filter(m => m.metadata?.hit === true).length;
    const total = cacheMetrics.length;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    return {
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
      metricTypes: Array.from(this.metrics.keys()),
      averageApiResponse: apiStats?.average || 0,
      averageDatabaseQuery: dbStats?.average || 0,
      averagePageLoad: pageStats?.average || 0,
      cacheHitRate: hitRate
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new SafePerformanceMonitor();

// Performance decorator for methods (optional, safe to use)
export function trackPerformance(name?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        performanceMonitor.track(metricName, duration, { success: true });
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        performanceMonitor.track(metricName, duration, { success: false, error: error.message });
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Performance utilities for common patterns
export const PerformanceUtils = {
  /**
   * Track API call performance
   */
  async trackApiCall<T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - start;
      performanceMonitor.trackApiResponse(endpoint, method, duration, 200);
      return result;
    } catch (error: any) {
      const duration = Date.now() - start;
      performanceMonitor.trackApiResponse(endpoint, method, duration, error.status || 500);
      throw error;
    }
  },

  /**
   * Track database query performance
   */
  async trackDatabaseQuery<T>(
    query: string,
    dbCall: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await dbCall();
      const duration = Date.now() - start;
      const rowCount = Array.isArray(result) ? result.length : 1;
      performanceMonitor.trackDatabaseQuery(query, duration, rowCount);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      performanceMonitor.trackDatabaseQuery(query, duration, 0);
      throw error;
    }
  },

  /**
   * Track cache operation performance
   */
  async trackCacheOperation<T>(
    key: string,
    cacheCall: () => Promise<T>,
    isHit: boolean
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await cacheCall();
      const duration = Date.now() - start;
      performanceMonitor.trackCacheHit(key, isHit, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      performanceMonitor.trackCacheHit(key, false, duration);
      throw error;
    }
  },

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderFn: () => void): void {
    const start = Date.now();
    renderFn();
    const duration = Date.now() - start;
    performanceMonitor.trackComponentRender(componentName, duration);
  },

  /**
   * Track page load performance
   */
  trackPageLoad(pageName: string, loadFn: () => void): void {
    const start = Date.now();
    loadFn();
    const duration = Date.now() - start;
    performanceMonitor.trackPageLoad(pageName, duration);
  }
};

// Web Vitals tracking (safe addition)
export const WebVitalsTracker = {
  /**
   * Track Core Web Vitals
   * Safe method for web vitals tracking
   */
  trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    try {
      // Track Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          performanceMonitor.track('web_vitals_lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Track First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            performanceMonitor.track('web_vitals_fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Track Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          performanceMonitor.track('web_vitals_cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }
    } catch (error) {
      // Silently fail to avoid breaking functionality
      console.warn('Web vitals tracking failed:', error);
    }
  }
};

// Export for use in other files
export default performanceMonitor;
