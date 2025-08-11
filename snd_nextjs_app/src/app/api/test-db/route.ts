import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { equipment, equipmentRentalHistory } from '@/lib/drizzle/schema';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Basic connection
    const testResult = await db.select().from(equipment).limit(1);
    console.log('Equipment table test successful:', testResult.length, 'records');
    
    // Test 2: Equipment rental history table
    const historyTest = await db
      .select({
        id: equipmentRentalHistory.id,
        equipmentId: equipmentRentalHistory.equipmentId
      })
      .from(equipmentRentalHistory)
      .limit(1);
    
    console.log('Equipment rental history test successful:', historyTest.length, 'records');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection and table access successful',
      equipmentCount: testResult.length,
      historyCount: historyTest.length
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}
