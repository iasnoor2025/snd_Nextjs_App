import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

class PrismaManager {
  private static instance: PrismaManager;
  private client: PrismaClient | null = null;
  private connectionPromise: Promise<PrismaClient> | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): PrismaManager {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager();
    }
    return PrismaManager.instance;
  }

  private createClient(): PrismaClient {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
    }

    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  async getClient(): Promise<PrismaClient> {
    // If we already have a connected client, return it
    if (this.client && this.isConnected) {
      return this.client;
    }

    // If there's already a connection in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create a new connection
    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }

  private async establishConnection(): Promise<PrismaClient> {
    try {
      // Check if client already exists in global scope
      if (global.__prisma) {
        this.client = global.__prisma;
        
        // Try to use the existing client without testing connection
        try {
          this.isConnected = true;
          console.log('Reusing existing Prisma client connection');
          return this.client;
        } catch (error) {
          console.log('Existing client connection lost, creating new connection...');
          // Connection lost, we'll create a new one
          this.isConnected = false;
        }
      }

      // Create new client
      this.client = this.createClient();
      
      // Connect without testing query
      await this.client.$connect();
      this.isConnected = true;
      console.log('Prisma client connected successfully');

      // Store in global scope to prevent multiple instances
      global.__prisma = this.client;

      // Handle process termination
      if (process.env.NODE_ENV === 'development') {
        process.on('beforeExit', async () => {
          await this.disconnect();
        });
      }

      return this.client;
    } catch (error) {
      console.error('Failed to establish Prisma connection:', error);
      this.connectionPromise = null;
      this.isConnected = false;
      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Try a simple operation instead of $queryRaw
      await this.client.$connect();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.log('Connection check failed, connection lost');
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.$disconnect();
      } catch (error) {
        console.error('Error disconnecting Prisma client:', error);
      }
      this.client = null;
      this.connectionPromise = null;
      this.isConnected = false;
      global.__prisma = undefined;
    }
  }

  async resetConnection(): Promise<PrismaClient> {
    console.log('Resetting Prisma connection...');
    await this.disconnect();
    return this.getClient();
  }

  isClientConnected(): boolean {
    return this.isConnected && this.client !== null;
  }
}

// Export singleton instance
export const prismaManager = PrismaManager.getInstance();

// Export convenience function
export async function getPrismaClient(): Promise<PrismaClient> {
  return prismaManager.getClient();
}

// Export safe operation wrapper with connection checking
export async function safePrismaOperation<T>(
  operation: (client: PrismaClient) => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    // Check if we already have a connected client
    if (prismaManager.isClientConnected()) {
      const isConnected = await prismaManager.checkConnection();
      if (isConnected) {
        // Use existing connection
        return await operation(prismaManager['client']!);
      }
    }

    // Get or create client
    const client = await getPrismaClient();
    return await operation(client);
  } catch (error) {
    console.error('Prisma operation failed:', error);
    
    // If it's a connection error, try to reset the connection
    if (error instanceof Error && error.message.includes('Engine is not yet connected')) {
      try {
        console.log('Attempting to reset Prisma connection...');
        const client = await prismaManager.resetConnection();
        return await operation(client);
      } catch (resetError) {
        console.error('Failed to reset Prisma connection:', resetError);
      }
    }
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw error;
  }
}
