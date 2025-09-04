import { authOptions } from '@/lib/auth-config';
import { DashboardService } from '@/lib/services/dashboard-service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.dashboard.read)(async (_request: NextRequest) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
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
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch Recent Activity data
    const activityData = await DashboardService.getRecentActivity(limit);
    
    console.log('Dashboard Activity API - Activity data fetched successfully');

    return NextResponse.json({ recentActivity: activityData });
  } catch (error) {
    console.error('Dashboard Activity API - Error:', error);
    return NextResponse.json({ recentActivity: [] });
  }
});
