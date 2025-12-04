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

    // Check Project permission
    const { checkUserPermission } = await import('@/lib/rbac/permission-service');
    const projectPermissionResult = await checkUserPermission(session.user.id, 'read', 'Project');
    
    if (!projectPermissionResult.hasPermission) {
      return NextResponse.json({ projectData: [] });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch Project data
    const projectData = await DashboardService.getActiveProjects(limit);

    return NextResponse.json({ projectData });
  } catch (error) {
    console.error('Dashboard Projects API - Error:', error);
    return NextResponse.json({ projectData: [] });
  }
});

