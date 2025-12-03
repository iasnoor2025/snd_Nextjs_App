import { createClient } from 'redis';
import { redisConfig, isRedisEnabled } from '../config/redis';

declare global {
  var __redisClient: ReturnType<typeof createClient> | undefined;
}

class RedisService {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    // Skip connection if Redis is disabled
    if (!isRedisEnabled()) {
      console.log('Redis is disabled - skipping connection');
      return;
    }

    if (this.client && this.isConnected) {
      return;
    }

    try {
      this.client = createClient({
        url: redisConfig.url,
        socket: redisConfig.connection,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        if (redisConfig.development.logConnection) {
          console.log('Redis Client Connected');
        }
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        if (redisConfig.development.logConnection) {
          console.log('Redis Client Ready');
        }
        this.isConnected = true;
      });

      this.client.on('end', () => {
        if (redisConfig.development.logConnection) {
          console.log('Redis Client Disconnected');
        }
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Store in global for development hot reload
      if (redisConfig.development.autoConnect) {
        global.__redisClient = this.client;
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!isRedisEnabled()) {
      return;
    }
    
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  getClient(): ReturnType<typeof createClient> {
    if (!isRedisEnabled()) {
      throw new Error('Redis is disabled');
    }
    
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected. Call connect() first.');
    }
    return this.client;
  }

  isClientConnected(): boolean {
    return isRedisEnabled() ? this.isConnected : false;
  }

  isRedisDisabled(): boolean {
    return !isRedisEnabled();
  }
}

// Singleton instance
const redisService = new RedisService();

// Connect on import in development (only if enabled)
if (redisConfig.development.autoConnect && isRedisEnabled()) {
  redisService.connect().catch(console.error);
}

export { redisService };
export default redisService;

// Export all caching functionality
export * from './cache-service';
export * from './query-cache';