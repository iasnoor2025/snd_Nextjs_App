import { createClient } from 'redis';

declare global {
  var __redisClient: ReturnType<typeof createClient> | undefined;
}

class RedisService {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 10000,
          lazyConnect: true,
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Store in global for development hot reload
      if (process.env.NODE_ENV === 'development') {
        global.__redisClient = this.client;
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  getClient(): ReturnType<typeof createClient> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected. Call connect() first.');
    }
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
const redisService = new RedisService();

// Connect on import in development
if (process.env.NODE_ENV === 'development') {
  redisService.connect().catch(console.error);
}

export { redisService };
export default redisService;

// Export all caching functionality
export * from './cache-service';
export * from './query-cache';
