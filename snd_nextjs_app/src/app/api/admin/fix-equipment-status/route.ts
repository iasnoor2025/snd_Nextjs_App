import { NextRequest, NextResponse } from 'next/server';
import { EquipmentStatusMonitor } from '@/lib/cron/equipment-status-monitor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

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
}
