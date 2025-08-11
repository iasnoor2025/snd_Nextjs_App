import { NextResponse } from 'next/server';
import { pool } from '@/lib/drizzle';

export async function GET() {
  try {
    const client = await pool.connect();
    
    // Check the structure of employee_assignments table
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_assignments'
      ORDER BY ordinal_position;
    `;
    
    const result = await client.query(structureQuery);
    client.release();
    
    return NextResponse.json({
      success: true,
      message: 'Table structure check successful',
      columns: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Table structure check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Table structure check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
