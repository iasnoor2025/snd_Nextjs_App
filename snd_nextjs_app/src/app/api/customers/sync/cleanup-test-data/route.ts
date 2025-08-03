import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function POST(request: NextRequest) {
  try {
    console.log('Starting cleanup of test data...');

    // Delete all customers that were created during testing
    const deleteResult = await prisma.customer.deleteMany({
      where: {
        OR: [
          { erpnext_id: { startsWith: 'TEST-' } },
          { name: { contains: 'Test' } },
          { company_name: { contains: 'Test' } },
          { erpnext_id: 'Sinopec International Petroleum Service' } // The test customer we just created
        ]
      }
    });

    console.log(`Cleaned up ${deleteResult.count} test customers`);

    // Also clean up any other test data if needed
    // You can add more cleanup operations here for other tables

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully. Deleted ${deleteResult.count} test customers.`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 