import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing simple database connection...');
    
    // Test basic database connection
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const client = await pool.connect();
    
    try {
      // Simple query to test connection
      const result = await client.query('SELECT 1 as test');
      console.log('Database connection successful:', result.rows);
      
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        data: result.rows
      });
      
    } finally {
      await client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
