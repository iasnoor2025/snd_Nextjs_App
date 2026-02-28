
import { DashboardService } from '@/lib/services/dashboard-service';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.dashboard.read)(async (_request: NextRequest) => {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Settings permission for activity
    const { checkUserPermission } = await import('@/lib/rbac/permission-service');
    const settingsPermissionResult = await checkUserPermission(session.user.id, 'read', 'Settings');
    
    if (!settingsPermissionResult.hasPermission) {
      return NextResponse.json({ recentActivity: [] });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 50);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));

    // Fetch Recent Activity data with pagination
    const [activityData, total] = await Promise.all([
      DashboardService.getRecentActivity(limit, offset),
      DashboardService.getRecentActivityCount(),
    ]);

    return NextResponse.json({ recentActivity: activityData, total });
  } catch (error) {
    console.error('Dashboard Activity API - Error:', error);
    return NextResponse.json({ recentActivity: [] });
  }
});
