import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

import { EquipmentStatusService } from '@/lib/services/equipment-status-service';
import { withPermission } from '@/lib/rbac/api-middleware';
import { PermissionConfigs } from '@/lib/rbac/api-middleware';

export const POST = withPermission(PermissionConfigs.admin.manage)(async (request: NextRequest) => {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔄 Admin ${session.user.email} triggered immediate update of all equipment statuses...`);
    
    // Update all equipment statuses immediately
    const result = await EquipmentStatusService.updateAllEquipmentStatuses();
    
    console.log('✅ Immediate equipment status update completed by admin');
    
    return NextResponse.json({
      success: true,
      message: 'All equipment statuses updated immediately',
      triggeredBy: session.user.email,
      timestamp: new Date().toISOString(),
      results: result
    });

  } catch (error) {
    console.error('❌ Immediate equipment status update failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Immediate equipment status update failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

export const GET = withPermission(PermissionConfigs.admin.read)(async (request: NextRequest) => {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Immediate equipment status update endpoint',
      endpoint: '/api/admin/update-all-equipment-status',
      method: 'POST',
      description: 'Updates all equipment statuses immediately based on current assignments and maintenance',
      requiresRole: ['SUPER_ADMIN', 'ADMIN']
    });

  } catch (error) {
    console.error('❌ Equipment status update endpoint info failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get endpoint info',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});
