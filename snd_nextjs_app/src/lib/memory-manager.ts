/**
 * Memory Manager Utility
 * Helps prevent memory leaks and improve performance during page refreshes
 */

class MemoryManager {
  private static instance: MemoryManager;
  private cleanupCallbacks: Set<() => void> = new Set();
  private isInitialized = false;

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

    // Set up global cleanup handlers
    this.setupGlobalCleanup();
  }

  private setupGlobalCleanup() {
    // Handle page unload
    const handleBeforeUnload = () => {
      this.performCleanup();
    };

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Optionally perform cleanup when page is hidden
        this.performPartialCleanup();
      }
    };

    // Handle memory pressure (if available)
    const handleMemoryPressure = () => {
      this.performCleanup();
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
   * Perform full cleanup
   */
  performCleanup() {
    console.log('Performing memory cleanup...');
    
    // Clear all cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });

    // Clear browser caches if possible
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // Clear localStorage if needed
    // localStorage.clear(); // Uncomment if you want to clear localStorage

    // Clear sessionStorage
    sessionStorage.clear();

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Perform partial cleanup (for when page is hidden)
   */
  performPartialCleanup() {
    console.log('Performing partial memory cleanup...');
    
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
  isMemoryUsageHigh(threshold = 80): boolean {
    const memoryInfo = this.getMemoryInfo();
    if (memoryInfo) {
      return memoryInfo.usagePercentage > threshold;
    }
    return false;
  }

  /**
   * Monitor memory usage and perform cleanup if needed
   */
  startMemoryMonitoring(threshold = 80, interval = 30000) {
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

export const isMemoryUsageHigh = (threshold = 80) => {
  return memoryManager.isMemoryUsageHigh(threshold);
};

export const startMemoryMonitoring = (threshold = 80, interval = 30000) => {
  memoryManager.startMemoryMonitoring(threshold, interval);
};
