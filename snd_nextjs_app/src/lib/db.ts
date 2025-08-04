import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

/**
 * Singleton Prisma Client
 * 
 * This ensures only ONE database connection is created and reused
 * across your entire application, preventing connection leaks.
 * 
 * How it works:
 * 1. Check if a client already exists in global scope
 * 2. If exists, reuse it (no new connection)
 * 3. If not exists, create new one and store it globally
 * 4. In development, store in global to prevent multiple instances
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

  return client;
}

// Export the singleton instance
export const prisma = getPrismaClient();
