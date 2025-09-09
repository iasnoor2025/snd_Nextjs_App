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

    // Check Timesheet permission
    const { checkUserPermission } = await import('@/lib/rbac/permission-service');
    const timesheetPermissionResult = await checkUserPermission(session.user.id, 'read', 'Timesheet');
    
    if (!timesheetPermissionResult.hasPermission) {
      return NextResponse.json({ timesheetData: [] });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch Timesheet data
    const timesheetData = await DashboardService.getTodayTimesheets(limit);
    

    return NextResponse.json({ timesheetData });
  } catch (error) {
    console.error('Dashboard Timesheets API - Error:', error);
    return NextResponse.json({ timesheetData: [] });
  }
});
