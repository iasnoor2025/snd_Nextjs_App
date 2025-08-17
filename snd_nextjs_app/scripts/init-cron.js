#!/usr/bin/env node

/**
 * Script to initialize the cron service
 * This can be run independently to start the cron jobs
 */

require('dotenv').config({ path: '.env.local' });

const { cronService } = require('../src/lib/services/cron-service');

async function main() {
  try {
    console.log('🚀 Initializing cron service...');
    
    // Initialize the cron service
    cronService.initialize();
    
    // Get status
    const status = cronService.getStatus();
    
    console.log('✅ Cron service initialized successfully!');
    console.log('📊 Status:', status);
    
    // Keep the process running
    console.log('⏰ Cron service is running. Press Ctrl+C to stop.');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down cron service...');
      cronService.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down cron service...');
      cronService.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize cron service:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
