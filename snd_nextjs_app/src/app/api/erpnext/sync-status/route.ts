import { db } from '@/lib/drizzle';
import { customers, employees } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get real counts from database using Drizzle
    const [employeeCountResult, customerCountResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(employees),
      db.select({ count: sql<number>`count(*)` }).from(customers),
    ]);

    const employeeCount = Number(employeeCountResult[0]?.count || 0);
    const customerCount = Number(customerCountResult[0]?.count || 0);

    // Get last sync times (you might want to store these in a separate table)
    // For now, we'll return null for last sync times
    const syncStatus = {
      customers: {
        count: customerCount,
        lastSync: null,
      },
      employees: {
        count: employeeCount,
        lastSync: null,
      },
      items: {
        count: 0, // Item model not available
        lastSync: null,
      },
    };

    return NextResponse.json({
      success: true,
      data: syncStatus,
      message: 'Sync status retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch sync status',
        data: {
          customers: { count: 0, lastSync: null },
          employees: { count: 0, lastSync: null },
          items: { count: 0, lastSync: null },
        },
      },
      { status: 500 }
    );
  }
}
