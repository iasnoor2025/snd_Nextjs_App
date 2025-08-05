import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM format
    const employeeId = searchParams.get('employeeId') || '';

    // Parse month
    const [year, monthNum] = month.split('-');
    if (!year || !monthNum) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    // Fix: Use the next month's day 0 to get the last day of current month
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);
    
    console.log('Date range debug:', {
      year,
      monthNum,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateLocal: startDate.toLocaleDateString(),
      endDateLocal: endDate.toLocaleDateString()
    });

    // Build query
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      deleted_at: null,
    };

    // If employeeId is provided, filter by employee
    if (employeeId) {
      where.employee_id = employeeId;
    }

    // Get timesheets for the month
    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        project_rel: true,
        rental: true,
        assignment: true,
      },
      orderBy: { date: 'asc' },
    });

    console.log('API Debug - Query params:', { month, employeeId, startDate, endDate });
    console.log('API Debug - Found timesheets:', timesheets.length);
    console.log('API Debug - First few timesheets:', timesheets.slice(0, 3).map(t => ({
      id: t.id,
      date: t.date,
      dateStr: t.date.toISOString().split('T')[0],
      hours_worked: t.hours_worked,
      hours_worked_type: typeof t.hours_worked,
      overtime_hours: t.overtime_hours,
      overtime_hours_type: typeof t.overtime_hours,
      employee: t.employee.first_name + ' ' + t.employee.last_name
    })));
    
    // Check for July 31st specifically
    const july31Timesheets = timesheets.filter(t => {
      const dateStr = t.date.toISOString().split('T')[0];
      return dateStr === '2024-07-31';
    });
    console.log('July 31st timesheets:', july31Timesheets.length, july31Timesheets.map(t => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      dateLocal: t.date.toLocaleDateString(),
      dateISO: t.date.toISOString(),
      employee: t.employee.first_name + ' ' + t.employee.last_name
    })));
    
    // Also check for any timesheets that might be July 31st but stored differently
    const allJulyTimesheets = timesheets.filter(t => {
      const dateStr = t.date.toISOString().split('T')[0];
      return dateStr.startsWith('2024-07');
    });
    console.log('All July timesheets count:', allJulyTimesheets.length);
    console.log('July dates found:', [...new Set(allJulyTimesheets.map(t => t.date.toISOString().split('T')[0]))].sort());

    // Create calendar data
    const calendar: { [key: string]: any } = {};
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    
    console.log('Calendar debug:', {
      year,
      monthNum,
      daysInMonth,
      lastDayOfMonth: new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]
    });

    // Fill all days in the month with default values
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${monthNum.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      calendar[dateStr] = {
        date: dateStr,
        day_of_week: dayOfWeek,
        day_name: dayNames[dayOfWeek],
        regular_hours: 0,
        overtime_hours: 0,
        timesheets: [],
      };
    }
    
    // Check if July 31st is in calendar
    if (month === '2024-07') {
      console.log('July 31st in calendar:', calendar['2024-07-31']);
    }

    // Fill with actual timesheet data
    timesheets.forEach(timesheet => {
      const dateStr = timesheet.date.toISOString().split('T')[0];
      console.log('Processing timesheet for date:', dateStr, 'Calendar has this date:', !!calendar[dateStr]);
      if (calendar[dateStr]) {
        const regularHours = typeof timesheet.hours_worked === 'string' ? parseFloat(timesheet.hours_worked) : Number(timesheet.hours_worked) || 0;
        const overtimeHours = typeof timesheet.overtime_hours === 'string' ? parseFloat(timesheet.overtime_hours) : Number(timesheet.overtime_hours) || 0;
        calendar[dateStr].regular_hours += regularHours;
        calendar[dateStr].overtime_hours += overtimeHours;
        calendar[dateStr].timesheets.push({
          id: timesheet.id.toString(),
          employeeId: timesheet.employee_id.toString(),
          date: dateStr,
          hoursWorked: typeof timesheet.hours_worked === 'string' ? parseFloat(timesheet.hours_worked) : Number(timesheet.hours_worked) || 0,
          overtimeHours: typeof timesheet.overtime_hours === 'string' ? parseFloat(timesheet.overtime_hours) : Number(timesheet.overtime_hours) || 0,
          status: timesheet.status,
          projectId: timesheet.project_id?.toString(),
          rentalId: timesheet.rental_id?.toString(),
          assignmentId: timesheet.assignment_id?.toString(),
          description: timesheet.description || '',
          tasksCompleted: timesheet.tasks || '',
          employee: {
            id: timesheet.employee.id.toString(),
            firstName: timesheet.employee.first_name,
            lastName: timesheet.employee.last_name,
            employeeId: timesheet.employee.employee_id,
            user: timesheet.employee.user ? {
              name: timesheet.employee.user.name,
              email: timesheet.employee.user.email,
            } : undefined,
          },
          project: timesheet.project_rel ? {
            id: timesheet.project_rel.id.toString(),
            name: timesheet.project_rel.name,
          } : undefined,
          rental: timesheet.rental ? {
            id: timesheet.rental.id.toString(),
            rentalNumber: timesheet.rental.rental_number,
          } : undefined,
          assignment: timesheet.assignment ? {
            id: timesheet.assignment.id.toString(),
            name: timesheet.assignment.name || '',
            type: timesheet.assignment.type,
          } : undefined,
        });
      }
    });
    
    // Check final calendar for July 31st
    if (month === '2024-07') {
      console.log('Final July 31st calendar data:', calendar['2024-07-31']);
    }

    // Calculate summary - properly handle Decimal types
    const totalRegularHours = timesheets.reduce((sum, t) => {
      const hours = typeof t.hours_worked === 'string' ? parseFloat(t.hours_worked) : Number(t.hours_worked) || 0;
      return sum + hours;
    }, 0);
    const totalOvertimeHours = timesheets.reduce((sum, t) => {
      const hours = typeof t.overtime_hours === 'string' ? parseFloat(t.overtime_hours) : Number(t.overtime_hours) || 0;
      return sum + hours;
    }, 0);
    const totalHours = totalRegularHours + totalOvertimeHours;
    const totalDays = timesheets.length;

    console.log('API Summary calculation:', {
      totalRegularHours,
      totalOvertimeHours,
      totalHours,
      totalDays,
      timesheetCount: timesheets.length,
      sampleTimesheet: timesheets.length > 0 ? {
        hours_worked: timesheets[0].hours_worked,
        hours_worked_type: typeof timesheets[0].hours_worked,
        overtime_hours: timesheets[0].overtime_hours,
        overtime_hours_type: typeof timesheets[0].overtime_hours,
      } : null
    });

    // Group by projects
    const projects = timesheets.reduce((acc, timesheet) => {
      const projectId = timesheet.project_id?.toString() || 'no-project';
      const projectName = timesheet.project_rel?.name || 'No Project';
      
      if (!acc[projectId]) {
        acc[projectId] = {
          id: projectId,
          name: projectName,
          hours: 0,
          overtime: 0,
          days: 0,
        };
      }
      
      const regularHours = typeof timesheet.hours_worked === 'string' ? parseFloat(timesheet.hours_worked) : Number(timesheet.hours_worked) || 0;
      const overtimeHours = typeof timesheet.overtime_hours === 'string' ? parseFloat(timesheet.overtime_hours) : Number(timesheet.overtime_hours) || 0;
      acc[projectId].hours += regularHours;
      acc[projectId].overtime += overtimeHours;
      acc[projectId].days += 1;
      
      return acc;
    }, {} as { [key: string]: any });

    const summary = {
      regularHours: Number(totalRegularHours) || 0,
      overtimeHours: Number(totalOvertimeHours) || 0,
      totalHours: Number(totalHours) || 0,
      totalDays: Number(totalDays) || 0,
      projects: Object.values(projects),
      month: new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };

    console.log('API Debug - Final summary:', summary);

    return NextResponse.json({
      calendar,
      summary,
      filters: {
        month,
        employeeId,
      },
    });
  } catch (error) {
    console.error('Error fetching monthly timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly timesheets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 