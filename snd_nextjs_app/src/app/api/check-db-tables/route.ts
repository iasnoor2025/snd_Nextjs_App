import { NextResponse } from 'next/server';
import { pool } from '@/lib/drizzle';

export async function GET() {
  try {
    const client = await pool.connect();
    
    // Check what tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    client.release();
    
    return NextResponse.json({
      success: true,
      message: 'Database tables check successful',
      tables: result.rows.map(row => row.table_name),
      count: result.rows.length
    });
  } catch (error) {
    console.error('Database tables check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database tables check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
