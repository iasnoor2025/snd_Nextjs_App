import { AutomatedMonthlyBillingService } from '@/lib/services/automated-monthly-billing-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    console.log('Starting automated monthly billing process...');
    
    const result = await AutomatedMonthlyBillingService.generateMonthlyInvoicesForAllRentals();
    
    console.log('Automated monthly billing completed:', {
      processed: result.processed,
      invoicesGenerated: result.invoices.length,
      errors: result.errors.length
    });
    
    return NextResponse.json({
      success: result.success,
      message: `Processed ${result.processed} rentals, generated ${result.invoices.length} monthly invoices`,
      data: {
        processed: result.processed,
        invoices: result.invoices,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Error in automated monthly billing:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate automated monthly invoices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get billing status for all active rentals
    const { db } = await import('@/lib/db');
    const { rentals } = await import('@/lib/drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const activeRentals = await db
      .select({
        id: rentals.id,
        rentalNumber: rentals.rentalNumber,
        startDate: rentals.startDate,
        expectedEndDate: rentals.expectedEndDate,
        lastInvoiceDate: rentals.lastInvoiceDate,
        lastInvoiceId: rentals.lastInvoiceId,
        lastInvoiceAmount: rentals.lastInvoiceAmount,
        status: rentals.status
      })
      .from(rentals)
      .where(eq(rentals.status, 'active'));

    return NextResponse.json({
      success: true,
      message: `Found ${activeRentals.length} active rentals`,
      data: {
        activeRentals,
        totalRentals: activeRentals.length
      }
    });
  } catch (error) {
    console.error('Error getting billing status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get billing status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
