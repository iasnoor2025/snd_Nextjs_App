#!/usr/bin/env node

/**
 * Automated Monthly Billing Cron Job
 * This script should be run monthly to generate invoices for all active rentals
 * 
 * Usage:
 * node scripts/automated-monthly-billing.js
 * 
 * Cron Schedule:
 * # Run on 1st of every month at 9 AM
 * 0 9 1 * * /usr/bin/node /path/to/scripts/automated-monthly-billing.js
 */

import { AutomatedMonthlyBillingService } from '../lib/services/automated-monthly-billing-service.js';

async function main() {
  console.log('🚀 Starting Automated Monthly Billing Process...');
  console.log('📅 Date:', new Date().toISOString());
  
  try {
    // Generate monthly invoices for all active rentals
    console.log('📋 Generating monthly invoices for all active rentals...');
    const result = await AutomatedMonthlyBillingService.generateMonthlyInvoicesForAllRentals();
    
    console.log('✅ Monthly Billing Results:');
    console.log(`   - Processed: ${result.processed} rentals`);
    console.log(`   - Invoices Generated: ${result.invoices.length}`);
    console.log(`   - Errors: ${result.errors.length}`);
    
    if (result.invoices.length > 0) {
      console.log('📄 Generated Invoices:');
      result.invoices.forEach(invoice => {
        console.log(`   - Rental ${invoice.rentalNumber}: ${invoice.invoiceNumber} (SAR ${invoice.totalAmount})`);
        console.log(`     Period: ${invoice.billingPeriod.startDate} to ${invoice.billingPeriod.endDate}`);
      });
    }
    
    if (result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach(error => {
        console.log(`   - Rental ${error.rentalId} (${error.rentalNumber}): ${error.error}`);
      });
    }
    
    console.log('🎉 Automated monthly billing process completed successfully!');
    
    // Exit with success code
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Automated monthly billing process failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
