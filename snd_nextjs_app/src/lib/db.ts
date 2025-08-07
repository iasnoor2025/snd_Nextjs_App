import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

/**
 * Singleton Prisma Client with improved connection handling
 * 
 * This ensures only ONE database connection is created and reused
 * across your entire application, preventing connection leaks.
 * 
 * How it works:
 * 1. Check if a client already exists in global scope
 * 2. If exists, reuse it (no new connection)
 * 3. If not exists, create new one and store it globally
 * 4. In development, store in global to prevent multiple instances
 * 5. Added proper connection handling and error recovery
 * 6. Added connection status checking to avoid unnecessary connections
 */
function getPrismaClient(): PrismaClient {
  // Check if client already exists
  if (global.__prisma) {
    return global.__prisma;
  }

  // Validate DATABASE_URL environment variable
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
  }

  // Create new client if none exists
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  // Store in global scope to prevent multiple instances
  global.__prisma = client;

  // Handle process termination to properly close connections
  if (process.env.NODE_ENV === 'development') {
    process.on('beforeExit', async () => {
      await client.$disconnect();
    });
  }

  return client;
}

// Export the singleton instance
export const prisma = getPrismaClient();

// Initialize Prisma client on module load
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function initializePrisma(): Promise<void> {
  if (isInitialized) return;
  
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      await prisma.$connect();
      isInitialized = true;
      console.log('Prisma client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Prisma client:', error);
      throw error;
    }
  })();

  return initializationPromise;
}

// Auto-initialize when module is loaded
if (typeof window === 'undefined') {
  // Only run on server side
  initializePrisma().catch(console.error);
}

// Export initialization function for manual control
export { initializePrisma };

// Export a function to ensure connection is ready with retry logic
export async function ensurePrismaConnection(maxRetries = 3): Promise<boolean> {
  // First try to initialize if not already done
  try {
    await initializePrisma();
    return true;
  } catch (error) {
    console.error('Failed to initialize Prisma:', error);
  }

  // If initialization failed, try manual connection
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log(`Database connection successful (attempt ${attempt})`);
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('All database connection attempts failed');
        return false;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Export a function to safely execute Prisma operations
export async function safePrismaOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    // Ensure Prisma is initialized first
    await initializePrisma();
    
    // Try the operation directly
    return await operation();
  } catch (error) {
    console.error('Prisma operation failed:', error);
    
    // If it's a connection error, try to connect and retry
    if (error instanceof Error && error.message.includes('Engine is not yet connected')) {
      try {
        console.log('Attempting to connect to database...');
        const isConnected = await ensurePrismaConnection();
        if (isConnected) {
          console.log('Reconnected to database, retrying operation...');
          return await operation();
        }
      } catch (reconnectError) {
        console.error('Failed to reconnect:', reconnectError);
      }
    }
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw error;
  }
}

// Re-export from prisma-manager for better connection handling
export { getPrismaClient, prismaManager } from './prisma-manager';

// Utility function to check if database is connected
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await initializePrisma();
    return true;
  } catch (error) {
    return false;
  }
}

// Utility function to get connection status
export async function getConnectionStatus(): Promise<{
  connected: boolean;
  clientExists: boolean;
  globalClientExists: boolean;
}> {
  const clientExists = prisma !== null;
  const globalClientExists = global.__prisma !== undefined;
  
  try {
    await initializePrisma();
    return {
      connected: true,
      clientExists,
      globalClientExists
    };
  } catch (error) {
    return {
      connected: false,
      clientExists,
      globalClientExists
    };
  }
}
