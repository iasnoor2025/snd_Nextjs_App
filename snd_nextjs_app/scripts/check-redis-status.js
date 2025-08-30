#!/usr/bin/env node

/**
 * Check Redis Status Script
 * 
 * This script checks the current Redis configuration and connection status.
 * Run with: node scripts/check-redis-status.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Redis Configuration Check\n');

// Check environment variables
const redisUrl = process.env.REDIS_URL;
const redisEnabled = process.env.REDIS_ENABLED;
const nodeEnv = process.env.NODE_ENV;

console.log('Environment Variables:');
console.log(`  NODE_ENV: ${nodeEnv || 'not set'}`);
console.log(`  REDIS_URL: ${redisUrl || 'not set'}`);
console.log(`  REDIS_ENABLED: ${redisEnabled || 'not set'}`);
console.log('');

// Determine Redis status
let redisStatus;
if (!redisUrl || redisUrl === '') {
  redisStatus = 'DISABLED (REDIS_URL is empty or not set)';
} else if (redisEnabled === 'false') {
  redisStatus = 'DISABLED (REDIS_ENABLED=false)';
} else {
  redisStatus = `ENABLED (${redisUrl})`;
}

console.log('Redis Status:', redisStatus);
console.log('');

// Recommendations
console.log('Recommendations:');
if (nodeEnv === 'development') {
  console.log('  • For development, you can disable Redis by setting:');
  console.log('    REDIS_URL="" in your .env.local file');
  console.log('    or');
  console.log('    REDIS_ENABLED=false in your .env.local file');
  console.log('');
  console.log('  • This will skip Redis connection attempts and use direct database queries');
} else {
  console.log('  • For production, ensure Redis is properly configured');
  console.log('  • Set REDIS_URL to your Redis server address');
}

console.log('');
console.log('✅ Check complete!');
