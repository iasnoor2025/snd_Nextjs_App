import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { DashboardService } from '@/lib/services/dashboard-service';

export async function GET(_request: NextRequest) {
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
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const isSeniorRole = session.user.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role);
    const dataLimit = isSeniorRole ? Math.min(limit, 500) : Math.min(limit, 500);

    // Fetch only today's timesheet data
    const timesheetData = await DashboardService.getTodayTimesheets(dataLimit);

    return NextResponse.json({
      timesheetData,
      message: 'Today\'s timesheet data fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching today\'s timesheet data:', error);
    
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
