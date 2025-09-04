import { authOptions } from '@/lib/auth-config';
import { DashboardService } from '@/lib/services/dashboard-service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.dashboard.read)(async (_request: NextRequest) => {
  try {
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
    });

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const dataLimit = Math.min(limit, 500);

    // Fetch all dashboard data in parallel for better performance
    const { checkUserPermission } = await import('@/lib/rbac/permission-service');
    
    // Check permissions in parallel
    const [iqamaPermissionResult, equipmentPermissionResult, timesheetPermissionResult, settingsPermissionResult] = await Promise.all([
      checkUserPermission(session.user.id, 'manage', 'Iqama'),
      checkUserPermission(session.user.id, 'read', 'Equipment'),
      checkUserPermission(session.user.id, 'read', 'Timesheet'),
      checkUserPermission(session.user.id, 'read', 'Settings')
    ]);

    // Fetch all data in parallel with ultra-minimal limits for maximum performance
    const dataFetchPromise = Promise.all([
      DashboardService.getDashboardStats(),
      iqamaPermissionResult.hasPermission ? DashboardService.getIqamaData(5) : Promise.resolve([]),
      equipmentPermissionResult.hasPermission ? DashboardService.getEquipmentData(5) : Promise.resolve([]),
      timesheetPermissionResult.hasPermission ? DashboardService.getTodayTimesheets(5) : Promise.resolve([]),
      DashboardService.getExpiringDocuments(5),
      DashboardService.getActiveLeaveRequests(5),
      DashboardService.getEmployeesCurrentlyOnLeave(),
      DashboardService.getActiveRentals(5),
      DashboardService.getActiveProjects(5).catch(() => []),
      settingsPermissionResult.hasPermission ? DashboardService.getRecentActivity(5) : Promise.resolve([])
    ]);

    // Race between data fetching and timeout
    let [
      stats,
      iqamaData,
      equipmentData,
      timesheetData,
      documentData,
      leaveData,
      employeesOnLeaveData,
      rentalData,
      projectData,
      activityData
    ] = await Promise.race([dataFetchPromise, timeoutPromise]);

    console.log('Dashboard API - All data fetched in parallel');

    return NextResponse.json({
      stats,
      iqamaData,
      equipment: equipmentData,
      timesheetData,
      documentData,
      leaveData,
      employeesOnLeaveData,
      rentalData,
      projectData,
      recentActivity: activityData,
    });
  } catch (error) {
    // If the main fetch fails, try to get at least the essential stats
    if (error instanceof Error && error.message === 'Request timeout') {
      console.log('Dashboard API - Timeout occurred, fetching essential stats only');
      
      try {
        const essentialStats = await DashboardService.getDashboardStats();
        return NextResponse.json({
          stats: essentialStats,
          iqamaData: [],
          equipment: [],
          timesheetData: [],
          documentData: [],
          leaveData: [],
          employeesOnLeaveData: [],
          rentalData: [],
          projectData: [],
          recentActivity: [],
        });
      } catch (statsError) {
        console.error('Dashboard API - Even essential stats failed:', statsError);
        return NextResponse.json({
          stats: {
            totalEmployees: 0,
            activeProjects: 0,
            totalProjects: 0,
            availableEquipment: 0,
            totalEquipment: 0,
            monthlyRevenue: 0,
            pendingApprovals: 0,
            activeRentals: 0,
            totalRentals: 0,
            totalCompanies: 0,
            totalDocuments: 0,
            equipmentUtilization: 0,
            todayTimesheets: 0,
            expiredDocuments: 0,
            expiringDocuments: 0,
            employeesOnLeave: 0,
            totalMoneyReceived: 0,
            totalMoneyLost: 0,
            monthlyMoneyReceived: 0,
            monthlyMoneyLost: 0,
            netProfit: 0,
            currency: 'SAR',
          },
          iqamaData: [],
          equipment: [],
          timesheetData: [],
          documentData: [],
          leaveData: [],
          employeesOnLeaveData: [],
          rentalData: [],
          projectData: [],
          recentActivity: [],
        });
      }
    }
      // Log more detailed error information
      console.error('Dashboard API - Critical error:', error);
      if (error instanceof Error) {
        console.error('Dashboard API - Error details:', error.stack);
      }

      // Handle timeout specifically
      if (error instanceof Error && error.message === 'Request timeout') {
        return NextResponse.json(
          {
            error: 'Request timeout',
            details: 'Dashboard data fetch took too long',
            timestamp: new Date().toISOString(),
          },
          { status: 408 }
        );
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
