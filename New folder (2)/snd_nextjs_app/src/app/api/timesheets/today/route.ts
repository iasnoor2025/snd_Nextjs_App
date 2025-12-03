
import { DashboardService } from '@/lib/services/dashboard-service';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.timesheet.read)(async (_request: NextRequest) => {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const dataLimit = Math.min(limit, 500);

    // Fetch only today's timesheet data
    const timesheetData = await DashboardService.getTodayTimesheets(dataLimit);

    return NextResponse.json({
      timesheetData,
      message: "Today's timesheet data fetched successfully",
    });
  } catch (error) {

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
          );
  }
});
