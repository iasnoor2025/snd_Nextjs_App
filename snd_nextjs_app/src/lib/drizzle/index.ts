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
  
  if (global.__drizzlePool) {
    console.log('Reusing existing database pool');
    return global.__drizzlePool;
  }
  
  console.log('Creating new database pool');
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Test the connection
  pool.on('connect', (client) => {
    console.log('New database client connected');
  });
  
  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
  });
  
  global.__drizzlePool = pool;
  return pool;
}

export const pool = getPool();
export const db = drizzle(pool);


