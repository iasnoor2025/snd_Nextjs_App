import { MonthlyBillingService } from '@/lib/services/monthly-billing-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const result = await MonthlyBillingService.generateMonthlyInvoices();
    
    return NextResponse.json({
      success: result.success,
      message: `Processed ${result.processed} rentals, generated ${result.invoices.length} invoices`,
      data: {
        processed: result.processed,
        invoices: result.invoices,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Error generating monthly invoices:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate monthly invoices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const result = await MonthlyBillingService.syncPaymentStatus();
    
    return NextResponse.json({
      success: result.success,
      message: `Synced payment status for ${result.synced} rentals`,
      data: {
        synced: result.synced,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Error syncing payment status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync payment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
