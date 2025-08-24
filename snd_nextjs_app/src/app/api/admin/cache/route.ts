import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { 
  getCacheStats, 
  clearAllCache, 
  invalidateCache, 
  invalidateCacheByPrefix 
} from '@/lib/redis';
import { CACHE_TAGS, CACHE_PREFIXES } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getCacheStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const target = searchParams.get('target');

    switch (action) {
      case 'clear-all':
        await clearAllCache();
        return NextResponse.json({
          success: true,
          message: 'All cache cleared successfully'
        });

      case 'clear-tag':
        if (!target) {
          return NextResponse.json(
            { error: 'Tag parameter required' },
            { status: 400 }
          );
        }
        await invalidateCache([target]);
        return NextResponse.json({
          success: true,
          message: `Cache cleared for tag: ${target}`
        });

      case 'clear-prefix':
        if (!target) {
          return NextResponse.json(
            { error: 'Prefix parameter required' },
            { status: 400 }
          );
        }
        await invalidateCacheByPrefix(target);
        return NextResponse.json({
          success: true,
          message: `Cache cleared for prefix: ${target}`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: clear-all, clear-tag, or clear-prefix' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, targets } = body;

    switch (action) {
      case 'invalidate-multiple':
        if (!targets || !Array.isArray(targets)) {
          return NextResponse.json(
            { error: 'Targets array required' },
            { status: 400 }
          );
        }
        await invalidateCache(targets);
        return NextResponse.json({
          success: true,
          message: `Cache invalidated for ${targets.length} tags`
        });

      case 'clear-dashboard':
        await invalidateCache([CACHE_TAGS.DASHBOARD]);
        return NextResponse.json({
          success: true,
          message: 'Dashboard cache cleared'
        });

      case 'clear-employees':
        await invalidateCache([CACHE_TAGS.EMPLOYEES]);
        return NextResponse.json({
          success: true,
          message: 'Employee cache cleared'
        });

      case 'clear-equipment':
        await invalidateCache([CACHE_TAGS.EQUIPMENT]);
        return NextResponse.json({
          success: true,
          message: 'Equipment cache cleared'
        });

      case 'clear-customers':
        await invalidateCache([CACHE_TAGS.CUSTOMERS]);
        return NextResponse.json({
          success: true,
          message: 'Customer cache cleared'
        });

      case 'clear-rentals':
        await invalidateCache([CACHE_TAGS.RENTALS]);
        return NextResponse.json({
          success: true,
          message: 'Rental cache cleared'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cache operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform cache operation' },
      { status: 500 }
    );
  }
}
