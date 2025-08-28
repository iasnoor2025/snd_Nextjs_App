import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { EquipmentStatusService } from '@/lib/services/equipment-status-service';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow SUPER_ADMIN and ADMIN to trigger this
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow SUPER_ADMIN and ADMIN to view this
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
}
