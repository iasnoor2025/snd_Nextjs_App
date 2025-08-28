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

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const dataLimit = Math.min(limit, 500);

    // Fetch all dashboard data sequentially to identify which call fails

    const stats = await DashboardService.getDashboardStats();

    const iqamaData = await DashboardService.getIqamaData(10000);

    // Fetch equipment data using DashboardService
    let equipmentData: Array<{
      status: 'available' | 'expired' | 'expiring' | 'missing';
      daysRemaining: number | null;
      id: number;
      equipmentName: string;
      equipmentNumber: string | null;
      istimara: string | null;
      istimaraExpiry: string | null;
    }> = [];

    try {
      equipmentData = await DashboardService.getEquipmentData(10000);
      console.log('Dashboard API - Equipment fetched:', equipmentData.length);
    } catch (error) {
      console.error('Dashboard API - Error fetching equipment:', error);
      equipmentData = [];
    }

    const timesheetData = await DashboardService.getTodayTimesheets(dataLimit);

    const documentData = await DashboardService.getExpiringDocuments(dataLimit);

    const leaveData = await DashboardService.getActiveLeaveRequests(dataLimit);

    const employeesOnLeaveData = await DashboardService.getEmployeesCurrentlyOnLeave();

    const rentalData = await DashboardService.getActiveRentals(dataLimit);

    // Fetch project data with better error handling
    let projectData: any[] = [];
    try {
      projectData = await DashboardService.getActiveProjects(dataLimit);
      console.log('Dashboard API - Projects fetched:', projectData.length);
    } catch (error) {
      console.error('Dashboard API - Error fetching projects:', error);
      projectData = [];
    }

    const activityData = await DashboardService.getRecentActivity(dataLimit);

    return NextResponse.json({
      stats,
      iqamaData,
      equipmentData,
      timesheetData,
      documentData,
      leaveData,
      employeesOnLeaveData,
      rentalData,
      projectData,
      recentActivity: activityData,
    });
  } catch (error) {
      // Log more detailed error information
      console.error('Dashboard API - Critical error:', error);
      if (error instanceof Error) {
        console.error('Dashboard API - Error details:', error.stack);
      }

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
