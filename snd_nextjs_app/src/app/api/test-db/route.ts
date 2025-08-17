import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { equipment } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Basic connection
    const connectionTest = await db.select({ test: sql`1` }).from(equipment).limit(1);
    console.log('Connection test result:', connectionTest);
    
    // Test 2: Count equipment
    const countResult = await db.select({ count: sql`count(*)` }).from(equipment);
    console.log('Equipment count:', countResult);
    
    // Test 3: Try to select one equipment record
    const equipmentTest = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        status: equipment.status
      })
      .from(equipment)
      .limit(1);
    
    console.log('Equipment test result:', equipmentTest);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        connection: 'OK',
        equipmentCount: countResult[0]?.count || 0,
        sampleEquipment: equipmentTest[0] || null
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
