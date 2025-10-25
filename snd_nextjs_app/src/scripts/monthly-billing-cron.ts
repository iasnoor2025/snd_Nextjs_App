import { MonthlyBillingService } from '@/lib/services/monthly-billing-service';

/**
 * Automated Monthly Billing Cron Job
 * This should be run monthly to generate invoices for all active rentals
 */
export async function runMonthlyBilling() {
  console.log('Starting monthly billing process...');
  
  try {
    // Generate monthly invoices for all active rentals
    const invoiceResult = await MonthlyBillingService.generateMonthlyInvoices();
    
    console.log(`Monthly billing completed:`, {
      processed: invoiceResult.processed,
      invoicesGenerated: invoiceResult.invoices.length,
      errors: invoiceResult.errors.length
    });

    // Sync payment status from ERPNext
    const paymentResult = await MonthlyBillingService.syncPaymentStatus();
    
    console.log(`Payment sync completed:`, {
      synced: paymentResult.synced,
      errors: paymentResult.errors.length
    });

    return {
      success: true,
      invoices: invoiceResult,
      payments: paymentResult
    };
  } catch (error) {
    console.error('Monthly billing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Daily Payment Status Sync
 * This should be run daily to keep payment status updated
 */
export async function runDailyPaymentSync() {
  console.log('Starting daily payment sync...');
  
  try {
    const result = await MonthlyBillingService.syncPaymentStatus();
    
    console.log(`Daily payment sync completed:`, {
      synced: result.synced,
      errors: result.errors.length
    });

    return result;
  } catch (error) {
    console.error('Daily payment sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Example cron job configurations:
/*
Monthly Billing (1st of every month at 9 AM):
0 9 1 * * /usr/bin/node /path/to/your/app/scripts/monthly-billing.js

Daily Payment Sync (Every day at 8 AM):
0 8 * * * /usr/bin/node /path/to/your/app/scripts/daily-payment-sync.js
*/
