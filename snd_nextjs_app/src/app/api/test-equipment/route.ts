import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing basic equipment query...');
    
    // Test basic equipment query
    const equipment = await prisma.equipment.findMany({
      take: 5, // Just get 5 items
      select: {
        id: true,
        name: true,
        status: true
      }
    });
    
    console.log('✅ Equipment query successful, found:', equipment.length, 'items');
    
    return NextResponse.json({
      success: true,
      message: 'Equipment query working',
      data: equipment,
      count: equipment.length
    });
    
  } catch (error) {
    console.error('❌ Equipment test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Equipment query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 