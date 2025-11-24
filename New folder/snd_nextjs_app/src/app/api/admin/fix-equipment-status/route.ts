import { NextRequest, NextResponse } from 'next/server';
import { EquipmentStatusMonitor } from '@/lib/cron/equipment-status-monitor';
import { getServerSession } from '@/lib/auth';

import { withPermission } from '@/lib/rbac/api-middleware';
import { PermissionConfigs } from '@/lib/rbac/api-middleware';

export const POST = withPermission(PermissionConfigs.admin.manage)(async (request: NextRequest) => {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔧 Admin ${session.user.email} triggered equipment status fix...`);
    
    // Run the monitoring and fixing
    const result = await EquipmentStatusMonitor.checkAndFixEquipmentStatus();
    
    // Get current status summary
    const statusSummary = await EquipmentStatusMonitor.getEquipmentStatusSummary();
    
    console.log('✅ Equipment status fix completed by admin');
    
    return NextResponse.json({
      success: true,
      message: 'Equipment status fix completed',
      triggeredBy: session.user.email,
      timestamp: new Date().toISOString(),
      results: {
        checked: result.checked,
        fixed: result.fixed,
        issues: result.issues,
        statusSummary: statusSummary
      }
    });

  } catch (error) {
    console.error('❌ Equipment status fix failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Equipment status fix failed',
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

    // Get current status summary and issues without fixing
    const statusSummary = await EquipmentStatusMonitor.getEquipmentStatusSummary();
    const issues = await EquipmentStatusMonitor.getEquipmentWithIssues();
    
    return NextResponse.json({
      success: true,
      message: 'Equipment status check completed',
      checkedBy: session.user.email,
      timestamp: new Date().toISOString(),
      data: {
        statusSummary,
        issues,
        totalIssues: issues.length
      }
    });

  } catch (error) {
    console.error('❌ Equipment status check failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Equipment status check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});
