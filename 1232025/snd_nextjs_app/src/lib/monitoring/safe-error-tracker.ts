/**
 * Safe Error Tracking Service
 * Provides error tracking without breaking existing functionality
 * All methods are safe and non-breaking
 */

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

export class SafeErrorTracker {
  private errors: ErrorReport[] = [];
  private maxErrors = 1000; // Prevent memory leaks
  private isEnabled = true;

  /**
   * Track an error
   * Safe method that won't break existing functionality
   */
  track(
    error: Error | string,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    category: string = 'general'
  ): void {
    if (!this.isEnabled) return;

    try {
      const errorReport: ErrorReport = {
        message: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'object' ? error.stack : undefined,
        context: {
          ...context,
          timestamp: Date.now(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        },
        severity,
        category
      };

      this.errors.push(errorReport);

      // Keep only recent errors
      if (this.errors.length > this.maxErrors) {
        this.errors.splice(0, this.errors.length - this.maxErrors);
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ErrorTracker] ${severity.toUpperCase()}:`, errorReport);
      }
    } catch (trackingError) {
      // Silently fail to avoid breaking functionality
      console.warn('Error tracking failed:', trackingError);
    }
  }

  /**
   * Track API errors
   * Safe method for API error tracking
   */
  trackApiError(
    endpoint: string,
    method: string,
    error: Error | string,
    statusCode?: number,
    context: ErrorContext = {}
  ): void {
    this.track(error, {
      ...context,
      metadata: {
        endpoint,
        method,
        statusCode
      }
    }, 'medium', 'api');
  }

  /**
   * Track database errors
   * Safe method for database error tracking
   */
  trackDatabaseError(
    query: string,
    error: Error | string,
    context: ErrorContext = {}
  ): void {
    this.track(error, {
      ...context,
      metadata: {
        query: query.substring(0, 200) // Truncate long queries
      }
    }, 'high', 'database');
  }

  /**
   * Track authentication errors
   * Safe method for auth error tracking
   */
  trackAuthError(
    error: Error | string,
    userId?: string,
    context: ErrorContext = {}
  ): void {
    this.track(error, {
      ...context,
      userId
    }, 'high', 'authentication');
  }

  /**
   * Track permission errors
   * Safe method for permission error tracking
   */
  trackPermissionError(
    error: Error | string,
    userId?: string,
    resource?: string,
    action?: string,
    context: ErrorContext = {}
  ): void {
    this.track(error, {
      ...context,
      userId,
      metadata: {
        resource,
        action
      }
    }, 'medium', 'permission');
  }

  /**
   * Track validation errors
   * Safe method for validation error tracking
   */
  trackValidationError(
    error: Error | string,
    field?: string,
    value?: any,
    context: ErrorContext = {}
  ): void {
    this.track(error, {
      ...context,
      metadata: {
        field,
        value: typeof value === 'object' ? '[Object]' : String(value)
      }
    }, 'low', 'validation');
  }

  /**
   * Track file upload errors
   * Safe method for file upload error tracking
   */
  trackFileUploadError(
    error: Error | string,
    fileName?: string,
    fileSize?: number,
    context: ErrorContext = {}
  ): void {
    this.track(error, {
      ...context,
      metadata: {
        fileName,
        fileSize
      }
    }, 'medium', 'file_upload');
  }

  /**
   * Track payment errors
   * Safe method for payment error tracking
   */
  trackPaymentError(
    error: Error | string,
    amount?: number,
    currency?: string,
    context: ErrorContext = {}
  ): void {
    this.track(error, {
      ...context,
      metadata: {
        amount,
        currency
      }
    }, 'critical', 'payment');
  }

  /**
   * Get error statistics
   * Safe method for error analysis
   */
  getStats(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    errorsByCategory: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const errorsBySeverity: Record<string, number> = {};
    const errorsByCategory: Record<string, number> = {};

    this.errors.forEach(error => {
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorsBySeverity,
      errorsByCategory,
      recentErrors: this.errors.slice(-50) // Last 50 errors
    };
  }

  /**
   * Get errors by severity
   * Safe method for filtering errors
   */
  getErrorsBySeverity(severity: string): ErrorReport[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Get errors by category
   * Safe method for filtering errors
   */
  getErrorsByCategory(category: string): ErrorReport[] {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * Get recent errors
   * Safe method for recent error analysis
   */
  getRecentErrors(limit: number = 100): ErrorReport[] {
    return this.errors.slice(-limit);
  }

  /**
   * Clear errors
   * Safe method for error cleanup
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Enable/disable error tracking
   * Safe method for controlling tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if tracking is enabled
   * Safe method for status checking
   */
  isTrackingEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get error summary
   * Safe method for error overview
   */
  getSummary(): {
    totalErrors: number;
    criticalErrors: number;
    highErrors: number;
    mediumErrors: number;
    lowErrors: number;
    topCategories: Array<{ category: string; count: number }>;
    topSeverities: Array<{ severity: string; count: number }>;
  } {
    const stats = this.getStats();
    
    const topCategories = Object.entries(stats.errorsByCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topSeverities = Object.entries(stats.errorsBySeverity)
      .map(([severity, count]) => ({ severity, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalErrors: stats.totalErrors,
      criticalErrors: stats.errorsBySeverity.critical || 0,
      highErrors: stats.errorsBySeverity.high || 0,
      mediumErrors: stats.errorsBySeverity.medium || 0,
      lowErrors: stats.errorsBySeverity.low || 0,
      topCategories,
      topSeverities
    };
  }
}

// Global error tracker instance
export const errorTracker = new SafeErrorTracker();

// Error tracking decorator for methods (optional, safe to use)
export function trackErrors(category: string = 'general', severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        errorTracker.track(error as Error, {
          metadata: {
            method: `${target.constructor.name}.${propertyName}`,
            args: args.map(arg => typeof arg === 'object' ? '[Object]' : String(arg))
          }
        }, severity, category);
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Error tracking utilities for common patterns
export const ErrorTrackingUtils = {
  /**
   * Track API call errors
   */
  async trackApiCall<T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error: any) {
      errorTracker.trackApiError(endpoint, method, error, error.status);
      throw error;
    }
  },

  /**
   * Track database query errors
   */
  async trackDatabaseQuery<T>(
    query: string,
    dbCall: () => Promise<T>
  ): Promise<T> {
    try {
      return await dbCall();
    } catch (error) {
      errorTracker.trackDatabaseError(query, error as Error);
      throw error;
    }
  },

  /**
   * Track authentication errors
   */
  trackAuthError(error: Error | string, userId?: string): void {
    errorTracker.trackAuthError(error, userId);
  },

  /**
   * Track permission errors
   */
  trackPermissionError(error: Error | string, userId?: string, resource?: string, action?: string): void {
    errorTracker.trackPermissionError(error, userId, resource, action);
  },

  /**
   * Track validation errors
   */
  trackValidationError(error: Error | string, field?: string, value?: any): void {
    errorTracker.trackValidationError(error, field, value);
  },

  /**
   * Track file upload errors
   */
  trackFileUploadError(error: Error | string, fileName?: string, fileSize?: number): void {
    errorTracker.trackFileUploadError(error, fileName, fileSize);
  },

  /**
   * Track payment errors
   */
  trackPaymentError(error: Error | string, amount?: number, currency?: string): void {
    errorTracker.trackPaymentError(error, amount, currency);
  }
};

// Global error handler for unhandled errors (safe addition)
export const setupGlobalErrorHandlers = (): void => {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      errorTracker.track(event.reason, {
        metadata: {
          type: 'unhandledrejection',
          promise: true
        }
      }, 'high', 'promise');
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      errorTracker.track(event.error || event.message, {
        metadata: {
          type: 'uncaught',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }, 'high', 'javascript');
    });
  }

  // Handle Node.js uncaught exceptions (server-side)
  if (typeof process !== 'undefined') {
    process.on('uncaughtException', (error) => {
      errorTracker.track(error, {
        metadata: {
          type: 'uncaughtException',
          process: true
        }
      }, 'critical', 'server');
    });

    process.on('unhandledRejection', (reason) => {
      errorTracker.track(reason as Error, {
        metadata: {
          type: 'unhandledRejection',
          process: true
        }
      }, 'high', 'server');
    });
  }
};

// Export for use in other files
export default errorTracker;
