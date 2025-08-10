import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { DashboardService } from '@/lib/services/dashboard-service';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an employee (redirect them to employee dashboard)
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const isSeniorRole = session.user.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    const dataLimit = isSeniorRole ? Math.min(limit, 500) : Math.min(limit, 500);

    // Fetch all dashboard data
    const [
      stats,
      iqamaData,
      timesheetData,
      documentData,
      leaveData,
      rentalData,
      projectData,
      activityData
    ] = await Promise.all([
      DashboardService.getDashboardStats(),
      DashboardService.getIqamaData(10000), 
      DashboardService.getTodayTimesheets(dataLimit),
      DashboardService.getExpiringDocuments(dataLimit),
      DashboardService.getActiveLeaveRequests(dataLimit),
      DashboardService.getActiveRentals(dataLimit),
      DashboardService.getActiveProjects(dataLimit),
      DashboardService.getRecentActivity(dataLimit)
    ]);

    return NextResponse.json({
      stats,
      iqamaData,
      timesheetData,
      documentData,
      leaveData,
      rentalData,
      projectData,
      recentActivity: activityData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
