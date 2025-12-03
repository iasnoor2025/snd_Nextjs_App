/**
 * Safe API Rate Limiting & Request Deduplication Service
 * Provides rate limiting and request deduplication without breaking existing functionality
 * All methods are safe and non-breaking
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
    ttl: number;
  };
}

export class SafeRateLimiter {
  private requests = new Map<string, number[]>();
  private requestCache: RequestCache = {};
  private defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  };

  /**
   * Check if request is within rate limit
   * Safe method that won't break existing functionality
   */
  isAllowed(
    identifier: string, 
    config: Partial<RateLimitConfig> = {}
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;

    // Get existing requests for this identifier
    const existingRequests = this.requests.get(identifier) || [];
    
    // Filter out old requests outside the window
    const recentRequests = existingRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    const allowed = recentRequests.length < finalConfig.maxRequests;
    const remaining = Math.max(0, finalConfig.maxRequests - recentRequests.length);
    const resetTime = recentRequests.length > 0 ? recentRequests[0] + finalConfig.windowMs : now + finalConfig.windowMs;

    // Store updated requests
    this.requests.set(identifier, recentRequests);

    return { allowed, remaining, resetTime };
  }

  /**
   * Record a request
   * Safe method for tracking requests
   */
  recordRequest(identifier: string, success: boolean = true): void {
    const now = Date.now();
    const existingRequests = this.requests.get(identifier) || [];
    existingRequests.push(now);
    this.requests.set(identifier, existingRequests);
  }

  /**
   * Get rate limit status for identifier
   * Safe method for checking current status
   */
  getStatus(identifier: string, config: Partial<RateLimitConfig> = {}): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalRequests: number;
  } {
    const status = this.isAllowed(identifier, config);
    const existingRequests = this.requests.get(identifier) || [];
    
    return {
      ...status,
      totalRequests: existingRequests.length
    };
  }

  /**
   * Clear rate limit data for identifier
   * Safe method for cleanup
   */
  clear(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limit data
   * Safe method for complete cleanup
   */
  clearAll(): void {
    this.requests.clear();
  }
}

export class SafeRequestDeduplicator {
  private cache: RequestCache = {};
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Deduplicate request by caching identical requests
   * Safe method that won't break existing functionality
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const now = Date.now();
    
    // Check if we have a cached request
    const cached = this.cache[key];
    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.promise;
    }

    // Create new request
    const promise = requestFn();
    
    // Cache the promise
    this.cache[key] = {
      promise,
      timestamp: now,
      ttl
    };

    // Clean up expired entries
    this.cleanup();

    return promise;
  }

  /**
   * Create request key from parameters
   * Safe utility method for consistent key generation
   */
  createKey(prefix: string, ...params: any[]): string {
    return `${prefix}:${params.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':')}`;
  }

  /**
   * Clear cached request
   * Safe method for cache invalidation
   */
  clear(key: string): void {
    delete this.cache[key];
  }

  /**
   * Clear all cached requests
   * Safe method for complete cache clearing
   */
  clearAll(): void {
    this.cache = {};
  }

  /**
   * Clean up expired entries
   * Private method for internal cache management
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Object.entries(this.cache)) {
      if (now - entry.timestamp >= entry.ttl) {
        delete this.cache[key];
      }
    }
  }
}

// Global instances
export const rateLimiter = new SafeRateLimiter();
export const requestDeduplicator = new SafeRequestDeduplicator();

// Rate limiting middleware for API routes
export const withRateLimit = (
  config: Partial<RateLimitConfig> = {},
  getIdentifier: (request: Request) => string = (req) => {
    // Default identifier based on IP and user agent
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent}`;
  }
) => {
  return (handler: Function) => {
    return async (request: Request, ...args: any[]) => {
      const identifier = getIdentifier(request);
      const status = rateLimiter.isAllowed(identifier, config);

      if (!status.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            remaining: status.remaining,
            resetTime: status.resetTime
          }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(config.maxRequests || 100),
              'X-RateLimit-Remaining': String(status.remaining),
              'X-RateLimit-Reset': String(status.resetTime)
            }
          }
        );
      }

      try {
        const result = await handler(request, ...args);
        rateLimiter.recordRequest(identifier, true);
        return result;
      } catch (error) {
        rateLimiter.recordRequest(identifier, false);
        throw error;
      }
    };
  };
};

// Request deduplication middleware for API routes
export const withDeduplication = (
  getKey: (request: Request) => string,
  ttl: number = 5 * 60 * 1000
) => {
  return (handler: Function) => {
    return async (request: Request, ...args: any[]) => {
      const key = getKey(request);
      
      return requestDeduplicator.deduplicate(key, async () => {
        return handler(request, ...args);
      }, ttl);
    };
  };
};

// Utility functions for common patterns
export const RateLimitUtils = {
  /**
   * Rate limit by user ID
   */
  byUserId(userId: string, config: Partial<RateLimitConfig> = {}) {
    return withRateLimit(config, () => `user:${userId}`);
  },

  /**
   * Rate limit by IP address
   */
  byIP(config: Partial<RateLimitConfig> = {}) {
    return withRateLimit(config, (req) => {
      const forwarded = req.headers.get('x-forwarded-for');
      return forwarded ? forwarded.split(',')[0] : 'unknown';
    });
  },

  /**
   * Rate limit by API endpoint
   */
  byEndpoint(config: Partial<RateLimitConfig> = {}) {
    return withRateLimit(config, (req) => {
      const url = new URL(req.url);
      return `endpoint:${req.method}:${url.pathname}`;
    });
  },

  /**
   * Deduplicate by request body
   */
  byBody(ttl: number = 5 * 60 * 1000) {
    return withDeduplication(async (req) => {
      const body = await req.text();
      const url = new URL(req.url);
      return `body:${req.method}:${url.pathname}:${body}`;
    }, ttl);
  },

  /**
   * Deduplicate by query parameters
   */
  byQuery(ttl: number = 5 * 60 * 1000) {
    return withDeduplication((req) => {
      const url = new URL(req.url);
      return `query:${req.method}:${url.pathname}:${url.search}`;
    }, ttl);
  }
};

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // Strict rate limiting for sensitive operations
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Standard rate limiting for API endpoints
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Lenient rate limiting for public endpoints
  LENIENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Rate limiting for authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Rate limiting for file uploads
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Rate limiting for reports generation
  REPORTS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }
};

// Export for use in other files
export default { rateLimiter, requestDeduplicator };
