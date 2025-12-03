import { MonthlyBillingService } from '@/lib/services/monthly-billing-service';

/**
 * Automated Monthly Billing Cron Job
 * This should be run monthly to generate invoices for all active rentals
 */
export async function runMonthlyBilling() {
  try {
    // Generate monthly invoices for all active rentals
    const invoiceResult = await MonthlyBillingService.generateMonthlyInvoices();
    // Sync payment status from ERPNext
    const paymentResult = await MonthlyBillingService.syncPaymentStatus();
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
  try {
    const result = await MonthlyBillingService.syncPaymentStatus();
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
