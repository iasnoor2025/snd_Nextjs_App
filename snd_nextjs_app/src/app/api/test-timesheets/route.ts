import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TEST TIMESHEETS - Fetching all timesheets...');
    
    const timesheets = await prisma.timesheet.findMany({
      take: 20,
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        project_rel: true,
        rental: true,
        assignment: true,
        approved_by_user: true,
      },
      orderBy: { date: 'desc' },
    });

    console.log('🔍 TEST TIMESHEETS - Found timesheets:', timesheets.map(t => ({
      id: t.id,
      status: t.status,
      employeeName: `${t.employee?.first_name} ${t.employee?.last_name}`,
      date: t.date,
      hoursWorked: t.hours_worked,
      overtimeHours: t.overtime_hours
    })));

    // Group by status
    const statusCounts = timesheets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('🔍 TEST TIMESHEETS - Status counts:', statusCounts);

    return NextResponse.json({
      success: true,
      total: timesheets.length,
      statusCounts,
      timesheets: timesheets.map(t => ({
        id: t.id,
        status: t.status,
        employeeName: `${t.employee?.first_name} ${t.employee?.last_name}`,
        date: t.date,
        hoursWorked: t.hours_worked,
        overtimeHours: t.overtime_hours
      }))
    });
  } catch (error) {
    console.error('🔍 TEST TIMESHEETS - Error:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheets' }, { status: 500 });
  }
} 