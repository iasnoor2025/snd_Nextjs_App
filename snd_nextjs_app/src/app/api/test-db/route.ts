import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if we can query the database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic query successful:', result);
    
    // Test if equipment table exists
    try {
      const equipmentCount = await prisma.equipment.count();
      console.log('✅ Equipment table exists, count:', equipmentCount);
      
      return NextResponse.json({
        success: true,
        message: 'Database connection working',
        equipmentCount: equipmentCount,
        equipmentTableExists: true
      });
    } catch (equipmentError) {
      console.log('❌ Equipment table error:', equipmentError);
      
      // Check if table exists
      try {
        const tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        console.log('Available tables:', tables);
        
        return NextResponse.json({
          success: true,
          message: 'Database connection working but equipment table may not exist',
          equipmentTableExists: false,
          availableTables: tables
        });
      } catch (tableError) {
        console.log('❌ Table query error:', tableError);
        return NextResponse.json({
          success: false,
          error: 'Cannot query database tables',
          details: tableError instanceof Error ? tableError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 