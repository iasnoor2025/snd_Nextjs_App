import { NextResponse } from 'next/server';
import { pool } from '@/lib/drizzle';

export async function GET() {
  try {
    const client = await pool.connect();
    
    // Check if the required tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('employee_assignments', 'timesheets', 'employees')
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    client.release();
    
    return NextResponse.json({
      success: true,
      message: 'Table check successful',
      tables: result.rows.map(row => row.table_name),
      count: result.rows.length
    });
  } catch (error) {
    console.error('Table check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Table check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
