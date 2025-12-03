
import { DashboardService } from '@/lib/services/dashboard-service';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.employee.read)(async (_request: NextRequest) => {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '10000');
    const dataLimit = Math.min(limit, 10000);

    // Fetch only Iqama data
    const iqamaData = await DashboardService.getIqamaData(dataLimit);

    return NextResponse.json({
      iqamaData,
      message: 'Iqama data fetched successfully',
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
