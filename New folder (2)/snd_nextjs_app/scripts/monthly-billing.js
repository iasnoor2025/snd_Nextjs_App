#!/usr/bin/env node

/**
 * Monthly Billing Script
 * Run this script monthly to generate invoices for all active rentals
 * 
 * Usage:
 * node scripts/monthly-billing.js
 */

import { MonthlyBillingService } from '../lib/services/monthly-billing-service.js';

async function main() {
  console.log('🚀 Starting Monthly Billing Process...');
  console.log('📅 Date:', new Date().toISOString());
  
  try {
    // Generate monthly invoices
    console.log('📋 Generating monthly invoices...');
    const invoiceResult = await MonthlyBillingService.generateMonthlyInvoices();
    
    console.log('✅ Invoice Generation Results:');
    console.log(`   - Processed: ${invoiceResult.processed} rentals`);
    console.log(`   - Invoices Generated: ${invoiceResult.invoices.length}`);
    console.log(`   - Errors: ${invoiceResult.errors.length}`);
    
    if (invoiceResult.errors.length > 0) {
      console.log('❌ Errors:');
      invoiceResult.errors.forEach(error => {
        console.log(`   - Rental ${error.rentalId}: ${error.error}`);
      });
    }
    
    // Sync payment status
    console.log('💳 Syncing payment status...');
    const paymentResult = await MonthlyBillingService.syncPaymentStatus();
    
    console.log('✅ Payment Sync Results:');
    console.log(`   - Synced: ${paymentResult.synced} rentals`);
    console.log(`   - Errors: ${paymentResult.errors.length}`);
    
    if (paymentResult.errors.length > 0) {
      console.log('❌ Payment Sync Errors:');
      paymentResult.errors.forEach(error => {
        console.log(`   - Rental ${error.rentalId}: ${error.error}`);
      });
    }
    
    console.log('🎉 Monthly billing process completed successfully!');
    
  } catch (error) {
    console.error('💥 Monthly billing process failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
