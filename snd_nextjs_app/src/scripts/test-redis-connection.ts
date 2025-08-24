#!/usr/bin/env tsx

import { redisService, cacheService } from '@/lib/redis';

async function testRedisConnection() {
  console.log('🧪 Testing Redis Connection...\n');

  try {
    // Test connection
    console.log('1. Testing connection...');
    await redisService.connect();
    console.log('✅ Redis connection successful\n');

    // Test basic operations
    console.log('2. Testing basic cache operations...');
    
    // Set a test value
    await cacheService.set('test:key', { message: 'Hello Redis!', timestamp: Date.now() }, { ttl: 60 });
    console.log('✅ Set cache value');

    // Get the test value
    const cachedValue = await cacheService.get('test:key');
    console.log('✅ Retrieved cached value:', cachedValue);

    // Test cache with tags
    await cacheService.set('test:tagged', { data: 'Tagged data' }, { ttl: 60, tags: ['test'] });
    console.log('✅ Set tagged cache value');

    // Get cache stats
    const stats = await cacheService.getStats();
    console.log('✅ Cache stats:', stats);

    // Clean up test data
    await cacheService.delete('test:key');
    await cacheService.delete('test:tagged');
    console.log('✅ Cleaned up test data');

    console.log('\n🎉 All Redis tests passed!');
    
  } catch (error) {
    console.error('\n❌ Redis test failed:', error);
    process.exit(1);
  } finally {
    // Disconnect
    await redisService.disconnect();
    console.log('\n🔌 Redis connection closed');
  }
}

// Run the test
testRedisConnection().catch(console.error);
