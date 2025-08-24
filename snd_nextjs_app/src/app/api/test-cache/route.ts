import { cacheService } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test cache service
    const testKey = 'test:cache:connection';
    const testValue = { message: 'Cache test', timestamp: Date.now() };
    
    // Try to set a value
    await cacheService.set(testKey, testValue, { ttl: 60 });
    
    // Try to get the value
    const retrieved = await cacheService.get(testKey);
    
    // Clean up
    await cacheService.delete(testKey);
    
    return NextResponse.json({
      success: true,
      message: 'Cache connection successful',
      testValue,
      retrieved,
      cacheWorking: JSON.stringify(retrieved) === JSON.stringify(testValue)
    });
  } catch (error) {
    console.error('Cache test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Cache connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
