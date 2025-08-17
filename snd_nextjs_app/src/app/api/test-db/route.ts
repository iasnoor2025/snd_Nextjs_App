import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';

export async function GET(_request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('Database connection successful:', result);
    
    // Test if tables exist
    try {
      const tablesResult = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('employee_assignments', 'timesheets', 'employees')
        ORDER BY table_name
      `);
      
      console.log('Available tables:', tablesResult);
      
      // Check if we have any data
      if (tablesResult.rows && tablesResult.rows.length > 0) {
        for (const table of tablesResult.rows) {
          const tableName = table.table_name as string;
          const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`);
          console.log(`Table ${tableName} has ${countResult.rows[0]?.count || 0} rows`);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Database connection and tables check successful',
        connection: 'OK',
        tables: tablesResult.rows || [],
        timestamp: new Date().toISOString()
      });
      
    } catch (tableError) {
      console.error('Error checking tables:', tableError);
      return NextResponse.json({
        success: false,
        message: 'Database connected but table check failed',
        connection: 'OK',
        error: tableError instanceof Error ? tableError.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
