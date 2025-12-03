import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { clearAllPermissionCaches, clearUserPermissionCache } from '@/lib/rbac/permission-service';

/**
 * API endpoint to invalidate permission caches
 * Requires 'manage.Settings' permission to prevent abuse
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage settings (required for cache invalidation)
    const permissionCheck = await checkUserPermission(
      session.user.id,
      'manage',
      'Settings'
    );

    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invalidate cache' },
        { status: 403 }
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
}

