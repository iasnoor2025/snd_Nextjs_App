import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

declare global {

  var __drizzlePool: Pool | undefined;

  var __drizzleDb: NodePgDatabase<typeof schema> | undefined;
}

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  if (global.__drizzlePool) {
    return global.__drizzlePool;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err: Error) => {
    console.error('Database pool error:', err);
  });

  // Light connection test (runs only when pool is first created)
  pool.query('SELECT 1').catch((err: Error) => {
    console.error('Database connection test failed:', err);
  });

  global.__drizzlePool = pool;
  return pool;
}

export function getPool(): Pool {
  try {
    return createPool();
  } catch (error) {
    console.error('Error creating database pool:', error);
    throw error;
  }
}

function createDb() {
  try {
    const pool = getPool();
    return drizzle(pool, { schema });
  } catch (error) {
    console.error('Error creating database connection:', error);
    throw error;
  }
}

export function getDb() {
  if (!global.__drizzleDb) {
    try {
      global.__drizzleDb = createDb();
    } catch (error) {
      console.error('Error creating database connection:', error);
    }
  }
  return global.__drizzleDb;
}

// Lazy proxies avoid touching the database at import-time during build
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    try {
      const poolInstance = getPool();
      return (poolInstance as unknown as Record<string, unknown>)[prop as string];
    } catch (error) {
      console.error('Error accessing pool property:', error);
      throw error;
    }
  },
});



export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    try {
      const dbInstance = getDb();
      return (dbInstance as unknown as Record<string, unknown>)[prop as string];
    } catch (error) {
      console.error('Error accessing db property:', error);
      throw error;
    }
  },
});
