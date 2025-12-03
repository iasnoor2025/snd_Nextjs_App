import { NextRequest, NextResponse } from 'next/server';
import { EquipmentStatusMonitor } from '@/lib/cron/equipment-status-monitor';

export async function POST(request: NextRequest) {
  try {
    // Check for cron secret to ensure this is called by a legitimate cron service
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Run the monitoring and fixing
    const result = await EquipmentStatusMonitor.checkAndFixEquipmentStatus();
    
    // Get current status summary
    const statusSummary = await EquipmentStatusMonitor.getEquipmentStatusSummary();
    return NextResponse.json({
      success: true,
      message: 'Equipment status monitoring completed',
      timestamp: new Date().toISOString(),
      results: {
        checked: result.checked,
        fixed: result.fixed,
        issues: result.issues,
        statusSummary: statusSummary
      }
    });

  } catch (error) {
    console.error('❌ Equipment status monitoring cron job failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Equipment status monitoring failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current status summary and issues without fixing
    const statusSummary = await EquipmentStatusMonitor.getEquipmentStatusSummary();
    const issues = await EquipmentStatusMonitor.getEquipmentWithIssues();
    
    return NextResponse.json({
      success: true,
      message: 'Equipment status check completed',
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
