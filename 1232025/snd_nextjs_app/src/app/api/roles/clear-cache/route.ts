import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache, CACHE_TAGS } from '@/lib/redis';

export async function POST(_request: NextRequest) {
  try {
    // Clear all roles-related cache
    await invalidateCache([CACHE_TAGS.ROLES, CACHE_TAGS.USERS]);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Roles cache cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing roles cache:', error);
    return NextResponse.json({ 
      error: 'Failed to clear roles cache' 
    }, { status: 500 });
  }
}
