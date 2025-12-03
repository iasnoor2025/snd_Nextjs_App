/**
 * Safe Database Connection Pooling Enhancement
 * Provides advanced connection pooling without breaking existing functionality
 * All methods are safe and non-breaking
 */

import { Pool, PoolClient, PoolConfig } from 'pg';

interface EnhancedPoolConfig extends PoolConfig {
  // Connection pool settings
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  
  // Health check settings
  healthCheckInterval?: number;
  healthCheckQuery?: string;
  
  // Retry settings
  maxRetries?: number;
  retryDelay?: number;
  
  // Monitoring settings
  enableMetrics?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  lastHealthCheck: Date;
  isHealthy: boolean;
}

export class SafeEnhancedPool {
  private pool: Pool;
  private config: EnhancedPoolConfig;
  private metrics: ConnectionMetrics;
  private healthCheckInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(config: EnhancedPoolConfig) {
    this.config = {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      healthCheckInterval: 30000,
      healthCheckQuery: 'SELECT 1',
      maxRetries: 3,
      retryDelay: 1000,
      enableMetrics: true,
      logLevel: 'info',
      ...config
    };

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      lastHealthCheck: new Date(),
      isHealthy: true
    };

    this.pool = new Pool(this.config);
    this.setupEventHandlers();
    this.startHealthCheck();
  }

  /**
   * Get a connection from the pool
   * Safe method that won't break existing functionality
   */
  async connect(): Promise<PoolClient> {
    if (this.isShuttingDown) {
      throw new Error('Pool is shutting down');
    }

    try {
      const client = await this.pool.connect();
      this.metrics.activeConnections++;
      return client;
    } catch (error) {
      this.metrics.failedQueries++;
      throw error;
    }
  }

  /**
   * Execute a query with automatic connection management
   * Safe method for query execution
   */
  async query<T = any>(text: string, params?: any[]): Promise<T> {
    const start = Date.now();
    this.metrics.totalQueries++;

    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      this.metrics.successfulQueries++;
      this.updateAverageQueryTime(duration);
      
      return result;
    } catch (error) {
      this.metrics.failedQueries++;
      throw error;
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   * Safe method for transaction management
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get connection pool metrics
   * Safe method for monitoring
   */
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get pool status
   * Safe method for health checking
   */
  getStatus(): {
    isHealthy: boolean;
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    lastHealthCheck: Date;
  } {
    return {
      isHealthy: this.metrics.isHealthy,
      totalConnections: this.pool.totalCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      lastHealthCheck: this.metrics.lastHealthCheck
    };
  }

  /**
   * Perform health check
   * Safe method for health monitoring
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query(this.config.healthCheckQuery!);
      this.metrics.isHealthy = true;
      this.metrics.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      this.metrics.isHealthy = false;
      this.metrics.lastHealthCheck = new Date();
      return false;
    }
  }

  /**
   * Close the pool gracefully
   * Safe method for cleanup
   */
  async close(): Promise<void> {
    this.isShuttingDown = true;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    await this.pool.end();
  }

  /**
   * Setup event handlers for monitoring
   * Private method for internal setup
   */
  private setupEventHandlers(): void {
    this.pool.on('connect', (client) => {
      this.metrics.totalConnections++;
      if (this.config.logLevel === 'debug') {
      }
    });

    this.pool.on('remove', (client) => {
      this.metrics.totalConnections--;
      if (this.config.logLevel === 'debug') {
      }
    });

    this.pool.on('error', (err) => {
      this.metrics.isHealthy = false;
      if (this.config.logLevel === 'error') {
        console.error('Pool error:', err);
      }
    });
  }

  /**
   * Start health check interval
   * Private method for internal setup
   */
  private startHealthCheck(): void {
    if (this.config.healthCheckInterval && this.config.healthCheckInterval > 0) {
      this.healthCheckInterval = setInterval(async () => {
        await this.healthCheck();
      }, this.config.healthCheckInterval);
    }
  }

  /**
   * Update average query time
   * Private method for metrics calculation
   */
  private updateAverageQueryTime(duration: number): void {
    const total = this.metrics.successfulQueries;
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (total - 1) + duration) / total;
  }
}

// Connection pool factory
export class SafeConnectionPoolFactory {
  private static pools = new Map<string, SafeEnhancedPool>();

  /**
   * Get or create a connection pool
   * Safe method for pool management
   */
  static getPool(name: string, config: EnhancedPoolConfig): SafeEnhancedPool {
    if (!this.pools.has(name)) {
      this.pools.set(name, new SafeEnhancedPool(config));
    }
    return this.pools.get(name)!;
  }

  /**
   * Get default connection pool
   * Safe method for default pool access
   */
  static getDefaultPool(): SafeEnhancedPool {
    return this.getPool('default', {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      healthCheckInterval: 30000,
      healthCheckQuery: 'SELECT 1',
      enableMetrics: true,
      logLevel: 'info'
    });
  }

  /**
   * Close all pools
   * Safe method for cleanup
   */
  static async closeAll(): Promise<void> {
    const closePromises = Array.from(this.pools.values()).map(pool => pool.close());
    await Promise.all(closePromises);
    this.pools.clear();
  }

  /**
   * Get all pool metrics
   * Safe method for monitoring
   */
  static getAllMetrics(): Record<string, ConnectionMetrics> {
    const metrics: Record<string, ConnectionMetrics> = {};
    for (const [name, pool] of this.pools) {
      metrics[name] = pool.getMetrics();
    }
    return metrics;
  }
}

// Database utilities for common patterns
export const DatabaseUtils = {
  /**
   * Execute query with retry logic
   */
  async queryWithRetry<T>(
    pool: SafeEnhancedPool,
    text: string,
    params?: any[],
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await pool.query<T>(text, params);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw lastError;
  },

  /**
   * Execute batch queries
   */
  async batchQuery<T>(
    pool: SafeEnhancedPool,
    queries: Array<{ text: string; params?: any[] }>
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (const query of queries) {
      const result = await pool.query<T>(query.text, query.params);
      results.push(result);
    }
    
    return results;
  },

  /**
   * Execute query with timeout
   */
  async queryWithTimeout<T>(
    pool: SafeEnhancedPool,
    text: string,
    params?: any[],
    timeoutMs: number = 30000
  ): Promise<T> {
    return Promise.race([
      pool.query<T>(text, params),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
      })
    ]);
  },

  /**
   * Check database connectivity
   */
  async checkConnectivity(pool: SafeEnhancedPool): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get database version
   */
  async getDatabaseVersion(pool: SafeEnhancedPool): Promise<string> {
    const result = await pool.query<{ version: string }>('SELECT version()');
    return result.rows[0]?.version || 'Unknown';
  },

  /**
   * Get database size
   */
  async getDatabaseSize(pool: SafeEnhancedPool): Promise<number> {
    const result = await pool.query<{ size: string }>(
      'SELECT pg_database_size(current_database()) as size'
    );
    return parseInt(result.rows[0]?.size || '0');
  }
};

// Export for use in other files
export default SafeConnectionPoolFactory;
