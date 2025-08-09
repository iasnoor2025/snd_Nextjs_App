export { db } from './drizzle';

// Transitional compatibility shims to unblock type-check during migration
// These do not perform real Prisma operations and should be removed after full Drizzle refactor.
export const prisma: any = new Proxy({}, {
  get() {
    throw new Error('Prisma has been removed. This code path must be migrated to Drizzle.');
  }
});

export async function ensurePrismaConnection(): Promise<boolean> {
  return true;
}

export async function safePrismaOperation<T = any>(operation: () => Promise<T>, fallback?: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (fallback !== undefined) return fallback as T;
    throw error;
  }
}

export async function initializePrisma(): Promise<boolean> {
  // Prisma removed; shim for legacy callers
  return true;
}
