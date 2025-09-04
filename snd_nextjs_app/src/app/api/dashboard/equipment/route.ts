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

    // Check Equipment permission
    const { checkUserPermission } = await import('@/lib/rbac/permission-service');
    const equipmentPermissionResult = await checkUserPermission(session.user.id, 'read', 'Equipment');
    

    
    if (!equipmentPermissionResult.hasPermission) {
      return NextResponse.json({ equipment: [] });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '250'); // Increased to show all equipment

    // Fetch Equipment data

    const equipmentData = await DashboardService.getEquipmentData(limit);
    

    // Check if we have real data from database
    if (equipmentData.length === 0) {
  
      return NextResponse.json({ equipment: [] });
    }

    return NextResponse.json({ equipment: equipmentData });
  } catch (error) {
    console.error('Dashboard Equipment API - Error:', error);
    return NextResponse.json({ equipment: [] });
  }
});
