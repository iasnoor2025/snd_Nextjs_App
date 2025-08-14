/**
 * Memory Manager Utility
 * Helps prevent memory leaks and improve performance during page refreshes
 */

class MemoryManager {
  private static instance: MemoryManager;
  private cleanupCallbacks: Set<() => void> = new Set();
  private isInitialized = false;
  private lastCleanupTime = 0;
  private cleanupCooldown = 30000; // 30 seconds cooldown between cleanups

  private constructor() {
    this.initialize();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Only set up global cleanup handlers on the client side
    if (typeof window !== 'undefined') {
      this.setupGlobalCleanup();
    }
  }

  private setupGlobalCleanup() {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Handle page unload - only on actual unload, not refresh
    const handleBeforeUnload = () => {
      // Only perform cleanup if it's been a while since last cleanup
      const now = Date.now();
      if (now - this.lastCleanupTime > this.cleanupCooldown) {
        this.performCleanup();
      }
    };

    // Handle page visibility change - less aggressive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Only perform partial cleanup after a longer delay
        setTimeout(() => {
          if (document.hidden) {
            this.performPartialCleanup();
          }
        }, 60000); // 1 minute delay
      }
    };

    // Handle memory pressure (if available) - less frequent
    const handleMemoryPressure = () => {
      const now = Date.now();
      if (now - this.lastCleanupTime > this.cleanupCooldown) {
        this.performCleanup();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add memory pressure listener if available
    if ('memory' in performance) {
      window.addEventListener('memorypressure', handleMemoryPressure);
    }

    // Store cleanup function for the event listeners
    this.addCleanupCallback(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if ('memory' in performance) {
        window.removeEventListener('memorypressure', handleMemoryPressure);
      }
    });
  }

  /**
   * Add a cleanup callback to be executed when cleanup is needed
   */
  addCleanupCallback(callback: () => void) {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Remove a cleanup callback
   */
  removeCleanupCallback(callback: () => void) {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Perform full cleanup with cooldown
   */
  performCleanup() {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const now = Date.now();
    if (now - this.lastCleanupTime < this.cleanupCooldown) {
      return; // Skip if too soon since last cleanup
    }

    this.lastCleanupTime = now;
    
    // Clear all cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });

    // Clear browser caches if possible - less aggressive
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        // Only clear old caches, not all
        const oldCaches = cacheNames.filter(name => 
          name.includes('old') || name.includes('temp')
        );
        oldCaches.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // Don't clear localStorage by default - too aggressive
    // localStorage.clear(); // Uncomment if you want to clear localStorage

    // Only clear sessionStorage if it's very large
    if (sessionStorage.length > 100) {
      sessionStorage.clear();
    }

    // Force garbage collection if available and memory usage is high
    if ('gc' in window && this.isMemoryUsageHigh(85)) {
      (window as any).gc();
    }
  }

  /**
   * Perform partial cleanup (for when page is hidden) - less aggressive
   */
  performPartialCleanup() {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const now = Date.now();
    if (now - this.lastCleanupTime < this.cleanupCooldown) {
      return; // Skip if too soon since last cleanup
    }

    this.lastCleanupTime = now;
    
    // Only perform non-destructive cleanup
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error during partial cleanup:', error);
      }
    });
  }

  /**
   * Get memory usage information
   */
  getMemoryInfo() {
    if (typeof window === 'undefined') return null;
    
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  /**
   * Check if memory usage is high
   */
  isMemoryUsageHigh(threshold = 85): boolean {
    const memoryInfo = this.getMemoryInfo();
    if (memoryInfo) {
      return memoryInfo.usagePercentage > threshold;
    }
    return false;
  }

  /**
   * Monitor memory usage and perform cleanup if needed - less frequent
   */
  startMemoryMonitoring(threshold = 85, interval = 120000) { // 2 minutes interval
    // Only run on client side
    if (typeof window === 'undefined') return;

    const monitor = setInterval(() => {
      if (this.isMemoryUsageHigh(threshold)) {
        console.warn('High memory usage detected, performing cleanup...');
        this.performCleanup();
      }
    }, interval);

    // Store the interval ID for cleanup
    this.addCleanupCallback(() => {
      clearInterval(monitor);
    });
  }

  /**
   * Get performance metrics for debugging
   */
  getPerformanceMetrics() {
    if (typeof window === 'undefined') return null;

    return {
      memory: this.getMemoryInfo(),
      navigation: null, // Removed deprecated performance.navigation
      timing: null, // Removed deprecated performance.timing
    };
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// Export utility functions
export const addCleanupCallback = (callback: () => void) => {
  memoryManager.addCleanupCallback(callback);
};

export const removeCleanupCallback = (callback: () => void) => {
  memoryManager.removeCleanupCallback(callback);
};

export const performCleanup = () => {
  memoryManager.performCleanup();
};

export const getMemoryInfo = () => {
  return memoryManager.getMemoryInfo();
};

export const isMemoryUsageHigh = (threshold = 85) => {
  return memoryManager.isMemoryUsageHigh(threshold);
};

export const startMemoryMonitoring = (threshold = 85, interval = 120000) => {
  memoryManager.startMemoryMonitoring(threshold, interval);
};

export const getPerformanceMetrics = () => {
  return memoryManager.getPerformanceMetrics();
};
