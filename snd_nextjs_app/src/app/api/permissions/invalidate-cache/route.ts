import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { clearAllPermissionCaches, clearUserPermissionCache } from '@/lib/rbac/permission-service';

/**
 * API endpoint to invalidate permission caches
 * Requires 'manage.Settings' permission to prevent abuse
 */
const invalidateCacheHandler = async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = await request.json().catch(() => ({}));

    if (userId) {
      // Clear cache for specific user
      clearUserPermissionCache(userId);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for user ${userId}`,
      });
    } else {
      // Clear all permission caches
      clearAllPermissionCaches();
      return NextResponse.json({
        success: true,
        message: 'All permission caches cleared',
      });
    }
  } catch (error) {
    console.error('Error invalidating permission cache:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.settings.manage)(invalidateCacheHandler);

