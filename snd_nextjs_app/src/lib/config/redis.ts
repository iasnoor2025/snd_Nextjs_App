/**
 * Redis Configuration
 * 
 * To disable Redis for development:
 * 1. Set REDIS_URL="" in your .env.local file
 * 2. Or set REDIS_ENABLED=false in your .env.local file
 */

export const redisConfig = {
  // Check if Redis is enabled
  enabled: process.env.REDIS_ENABLED !== 'false' && !!process.env.REDIS_URL && process.env.REDIS_URL !== '',
  
  // Redis connection URL
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Connection options
  connection: {
    connectTimeout: 10000,
    lazyConnect: true,
  },
  
  // Cache settings
  cache: {
    defaultTTL: 300, // 5 minutes
    keyPrefix: 'app:',
  },
  
  // Development settings
  development: {
    autoConnect: process.env.NODE_ENV === 'development',
    logConnection: process.env.NODE_ENV === 'development',
  }
};

/**
 * Check if Redis should be used
 */
export function isRedisEnabled(): boolean {
  return redisConfig.enabled;
}

/**
 * Get Redis connection status message
 */
export function getRedisStatus(): string {
  if (!redisConfig.enabled) {
    return 'Redis is disabled';
  }
  
  if (process.env.NODE_ENV === 'development') {
    return `Redis enabled for development (${redisConfig.url})`;
  }
  
  return `Redis enabled for production (${redisConfig.url})`;
}
