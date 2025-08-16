/**
 * Optimized Memory Manager Utility
 * Lightweight memory management with minimal performance impact
 */

class MemoryManager {
  private static instance: MemoryManager;
  private cleanupCallbacks: Set<() => void> = new Set();
  private isInitialized = false;
  private lastCleanupTime = 0;
  private cleanupCooldown = 60000; // Increased to 1 minute
  private memoryThreshold = 0.85; // 85% memory usage threshold

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

    // Handle page unload - less aggressive
    const handleBeforeUnload = () => {
      const now = Date.now();
      if (now - this.lastCleanupTime > this.cleanupCooldown) {
        this.performLightCleanup();
      }
    };

    // Handle page visibility change - minimal impact
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Only perform cleanup after extended hidden time
        setTimeout(() => {
          if (document.hidden) {
            this.performLightCleanup();
          }
        }, 120000); // 2 minutes delay
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Store cleanup function for the event listeners
    this.addCleanupCallback(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
   * Start memory monitoring with optimized settings
   */
  startMemoryMonitoring(threshold: number = 85, interval: number = 120000) {
    if (typeof window === 'undefined') return;

    this.memoryThreshold = threshold / 100;

    const monitorMemory = () => {
      if (this.shouldPerformCleanup()) {
        this.performLightCleanup();
      }
    };

    // Monitor every 2 minutes instead of every minute
    const memoryInterval = setInterval(monitorMemory, interval);

    // Store cleanup function
    this.addCleanupCallback(() => {
      clearInterval(memoryInterval);
    });
  }

  /**
   * Check if cleanup should be performed
   */
  private shouldPerformCleanup(): boolean {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return false;
    }

    const memory = (performance as any).memory;
    const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    return memoryUsage > this.memoryThreshold;
  }

  /**
   * Perform light cleanup to minimize performance impact
   */
  private performLightCleanup() {
    const now = Date.now();
    if (now - this.lastCleanupTime < this.cleanupCooldown) {
      return;
    }

    this.lastCleanupTime = now;

    // Execute cleanup callbacks with error handling
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Memory cleanup callback failed:', error);
      }
    });
  }

  /**
   * Perform full cleanup (only when necessary)
   */
  private performFullCleanup() {
    const now = Date.now();
    if (now - this.lastCleanupTime < this.cleanupCooldown) {
      return;
    }

    this.lastCleanupTime = now;
    this.performLightCleanup();

    // Force garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      try {
        (window as any).gc();
      } catch (error) {
        // GC not available or failed
      }
    }
  }

  /**
   * Manual cleanup trigger
   */
  manualCleanup() {
    this.performFullCleanup();
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      usage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
    };
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.cleanupCallbacks.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// Export convenience functions
export const addCleanupCallback = (callback: () => void) => {
  memoryManager.addCleanupCallback(callback);
};

export const removeCleanupCallback = (callback: () => void) => {
  memoryManager.removeCleanupCallback(callback);
};

export const startMemoryMonitoring = (threshold: number = 85, interval: number = 120000) => {
  memoryManager.startMemoryMonitoring(threshold, interval);
};

export const manualCleanup = () => {
  memoryManager.manualCleanup();
};

export const getMemoryStats = () => {
  return memoryManager.getMemoryStats();
};
