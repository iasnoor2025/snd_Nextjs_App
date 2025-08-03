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
 * 2. If exists, reuse it
 * 3. If not exists, create new one and store it globally
 * 4. In development, store in global to prevent multiple instances
 */
export function getPrismaClient(): PrismaClient {
  // Check if client already exists
  if (global.__prisma) {
    console.log('🔄 Reusing existing Prisma client');
    return global.__prisma;
  }

  // Create new client if none exists
  console.log('🆕 Creating new Prisma client');
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
  });

  // Store in global scope to prevent multiple instances
  global.__prisma = client;

  return client;
}

// Export the singleton instance
export const prisma = getPrismaClient();

// Cleanup function for graceful shutdown
export async function disconnectPrisma() {
  if (global.__prisma) {
    await global.__prisma.$disconnect();
    global.__prisma = undefined;
    console.log('🔌 Prisma client disconnected');
  }
}

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectPrisma();
});

process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
}); 