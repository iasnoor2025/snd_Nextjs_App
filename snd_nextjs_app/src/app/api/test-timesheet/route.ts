import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await prisma.$connect();

    // Get all timesheets
    const timesheets = await prisma.timesheet.findMany({
      take: 10,
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            full_name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Get timesheet count
    const timesheetCount = await prisma.timesheet.count();

    // Get employee count
    const employeeCount = await prisma.employee.count();

    return NextResponse.json({
      success: true,
      data: {
        timesheetCount,
        employeeCount,
        recentTimesheets: timesheets.map(ts => ({
          id: ts.id,
          employee_id: ts.employee_id,
          employee_name: ts.employee?.full_name || `${ts.employee?.first_name} ${ts.employee?.last_name}`,
          date: ts.date,
          hours_worked: ts.hours_worked,
          overtime_hours: ts.overtime_hours,
          status: ts.status
        }))
      },
      message: 'Timesheet data retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving timesheet data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error retrieving timesheet data: ' + (error as Error).message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 