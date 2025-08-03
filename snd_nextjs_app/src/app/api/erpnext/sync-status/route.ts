import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function GET(request: NextRequest) {
  try {
    // Get real counts from database
    const employeeCount = await prisma.employee.count();
    const customerCount = await prisma.customer?.count() || 0;
    // const itemCount = await prisma.item?.count() || 0; // Item model not available

    // Get last sync times (you might want to store these in a separate table)
    // For now, we'll return null for last sync times
    const syncStatus = {
      customers: { 
        count: customerCount, 
        lastSync: null 
      },
      employees: { 
        count: employeeCount, 
        lastSync: null 
      },
      items: { 
        count: 0, // Item model not available
        lastSync: null 
      },
    };

    return NextResponse.json({
      success: true,
      data: syncStatus,
      message: 'Sync status retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch sync status',
      data: {
        customers: { count: 0, lastSync: null },
        employees: { count: 0, lastSync: null },
        items: { count: 0, lastSync: null },
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 