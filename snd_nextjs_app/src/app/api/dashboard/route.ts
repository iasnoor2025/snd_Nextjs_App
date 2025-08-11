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

    // Fetch all dashboard data sequentially to identify which call fails
    console.log('Starting dashboard data fetch...');
    
    console.log('Fetching stats...');
    const stats = await DashboardService.getDashboardStats();
    console.log('Stats fetched successfully');
    
    console.log('Fetching iqama data...');
    const iqamaData = await DashboardService.getIqamaData(10000);
    console.log('Iqama data fetched successfully');
    
    console.log('Fetching timesheet data...');
    const timesheetData = await DashboardService.getTodayTimesheets(dataLimit);
    console.log('Timesheet data fetched successfully');
    
    console.log('Fetching document data...');
    const documentData = await DashboardService.getExpiringDocuments(dataLimit);
    console.log('Document data fetched successfully');
    
    console.log('Fetching leave data...');
    const leaveData = await DashboardService.getActiveLeaveRequests(dataLimit);
    console.log('Leave data fetched successfully');
    
    console.log('Fetching employees on leave data...');
    const employeesOnLeaveData = await DashboardService.getEmployeesCurrentlyOnLeave();
    console.log('Employees on leave data fetched successfully');
    
    console.log('Fetching rental data...');
    const rentalData = await DashboardService.getActiveRentals(dataLimit);
    console.log('Rental data fetched successfully');
    
    console.log('Fetching project data...');
    const projectData = await DashboardService.getActiveProjects(dataLimit);
    console.log('Project data fetched successfully');
    
    console.log('Fetching activity data...');
    const activityData = await DashboardService.getRecentActivity(dataLimit);
    console.log('Activity data fetched successfully');
    
    console.log('All dashboard data fetched successfully');

    return NextResponse.json({
      stats,
      iqamaData,
      timesheetData,
      documentData,
      leaveData,
      employeesOnLeaveData,
      rentalData,
      projectData,
      recentActivity: activityData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
