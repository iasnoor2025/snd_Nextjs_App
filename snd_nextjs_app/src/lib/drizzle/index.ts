import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __drizzlePool: Pool | undefined;
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  if (global.__drizzlePool) return global.__drizzlePool;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  global.__drizzlePool = pool;
  return pool;
}

export const pool = getPool();
export const db = drizzle(pool);


