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

    // Check Iqama permission
    const { checkUserPermission } = await import('@/lib/rbac/permission-service');
    const iqamaPermissionResult = await checkUserPermission(session.user.id, 'manage', 'Iqama');
    
    if (!iqamaPermissionResult.hasPermission) {
      return NextResponse.json({ iqamaData: [] });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '250');

    // Fetch Iqama data
    const iqamaData = await DashboardService.getIqamaData(limit);
    
    console.log('Dashboard Iqama API - Iqama data fetched successfully');

    return NextResponse.json({ iqamaData });
  } catch (error) {
    console.error('Dashboard Iqama API - Error:', error);
    return NextResponse.json({ iqamaData: [] });
  }
});
