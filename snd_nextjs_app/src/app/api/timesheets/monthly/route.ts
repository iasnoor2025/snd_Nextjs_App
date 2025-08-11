import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timesheets, employees, users, projects as projectsTable, rentals, employeeAssignments } from '@/lib/drizzle/schema';
import { and, eq, gte, lte, isNull, asc } from 'drizzle-orm';
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
    const whereConditions: any[] = [
      gte(timesheets.date, startDate.toISOString()),
      lte(timesheets.date, endDate.toISOString()),
      isNull(timesheets.deletedAt)
    ];

    // If employeeId is provided, filter by employee
    if (employeeId) {
      console.log('Filtering by employee ID:', employeeId, 'Type:', typeof employeeId);
      // Convert to number if it's a string, since database expects number
      const empId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId;
      whereConditions.push(eq(timesheets.employeeId, empId));
      console.log('Converted employee ID for database:', empId);
    } else {
      console.log('No employee filter applied - showing all employees');
    }

    // Get timesheets for the month
    const timesheetsData = await db
      .select({
        id: timesheets.id,
        employeeId: timesheets.employeeId,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        status: timesheets.status,
        projectId: timesheets.projectId,
        rentalId: timesheets.rentalId,
        assignmentId: timesheets.assignmentId,
        description: timesheets.description,
        tasks: timesheets.tasks,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
          user: {
            name: users.name as string,
            email: users.email as string,
          },
        },
        project: {
          id: projectsTable.id,
          name: projectsTable.name,
        },
        rental: {
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
        },
        assignment: {
          id: employeeAssignments.id,
          name: employeeAssignments.name,
          type: employeeAssignments.type,
        },
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(projectsTable, eq(timesheets.projectId, projectsTable.id))
      .leftJoin(rentals, eq(timesheets.rentalId, rentals.id))
      .leftJoin(employeeAssignments, eq(timesheets.assignmentId, employeeAssignments.id))
      .where(and(...whereConditions))
      .orderBy(asc(timesheets.date));

    console.log('API Debug - Query params:', { month, employeeId, startDate, endDate });
    console.log('API Debug - Found timesheets:', timesheetsData.length);
    console.log('API Debug - Employee IDs in results:', Array.from(new Set(timesheetsData.map(t => t.employeeId))));
    console.log('API Debug - First few timesheets:', timesheetsData.slice(0, 3).map(t => ({
      id: t.id,
      date: t.date,
      dateStr: new Date(t.date as string).toISOString().split('T')[0],
      hoursWorked: t.hoursWorked,
      hoursWorkedType: typeof t.hoursWorked,
      overtimeHours: t.overtimeHours,
      overtimeHoursType: typeof t.overtimeHours,
      employee: t.employee.firstName + ' ' + t.employee.lastName,
      employeeId: t.employeeId
    })));

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

    // Fill with actual timesheet data
    timesheetsData.forEach(timesheet => {
      const dateStr = new Date(timesheet.date as string).toISOString().split('T')[0];
      console.log('Processing timesheet for date:', dateStr, 'Calendar has this date:', !!calendar[dateStr]);
      if (calendar[dateStr]) {
        const regularHours = typeof timesheet.hoursWorked === 'string' ? parseFloat(timesheet.hoursWorked) : Number(timesheet.hoursWorked) || 0;
        const overtimeHours = typeof timesheet.overtimeHours === 'string' ? parseFloat(timesheet.overtimeHours) : Number(timesheet.overtimeHours) || 0;
        calendar[dateStr].regular_hours += regularHours;
        calendar[dateStr].overtime_hours += overtimeHours;
        calendar[dateStr].timesheets.push({
          id: timesheet.id.toString(),
          employeeId: timesheet.employeeId.toString(),
          date: dateStr,
          hoursWorked: typeof timesheet.hoursWorked === 'string' ? parseFloat(timesheet.hoursWorked) : Number(timesheet.hoursWorked) || 0,
          overtimeHours: typeof timesheet.overtimeHours === 'string' ? parseFloat(timesheet.overtimeHours) : Number(timesheet.overtimeHours) || 0,
          status: timesheet.status,
          projectId: timesheet.projectId?.toString(),
          rentalId: timesheet.rentalId?.toString(),
          assignmentId: timesheet.assignmentId?.toString(),
          description: timesheet.description || '',
          tasksCompleted: timesheet.tasks || '',
          employee: {
            id: timesheet.employee.id.toString(),
            firstName: timesheet.employee.firstName,
            lastName: timesheet.employee.lastName,
            employeeId: timesheet.employee.employeeId,
            user: timesheet.employee.user ? {
              name: timesheet.employee.user.name,
              email: timesheet.employee.user.email,
            } : undefined,
          },
          project: timesheet.project ? {
            id: timesheet.project.id.toString(),
            name: timesheet.project.name,
          } : undefined,
          rental: timesheet.rental ? {
            id: timesheet.rental.id.toString(),
            rentalNumber: timesheet.rental.rentalNumber,
          } : undefined,
          assignment: timesheet.assignment ? {
            id: timesheet.assignment.id.toString(),
            name: timesheet.assignment.name || '',
            type: timesheet.assignment.type,
          } : undefined,
        });
      }
    });

    // Calculate summary - properly handle Decimal types
    const totalRegularHours = timesheetsData.reduce((sum, t) => {
      const hours = typeof t.hoursWorked === 'string' ? parseFloat(t.hoursWorked) : Number(t.hoursWorked) || 0;
      return sum + hours;
    }, 0);
    const totalOvertimeHours = timesheetsData.reduce((sum, t) => {
      const hours = typeof t.overtimeHours === 'string' ? parseFloat(t.overtimeHours) : Number(t.overtimeHours) || 0;
      return sum + hours;
    }, 0);
    const totalHours = totalRegularHours + totalOvertimeHours;
    const totalDays = timesheetsData.length;

    console.log('API Summary calculation:', {
      totalRegularHours,
      totalOvertimeHours,
      totalHours,
      totalDays,
      timesheetCount: timesheetsData.length,
      sampleTimesheet: timesheetsData.length > 0 ? {
        hoursWorked: timesheetsData[0].hoursWorked,
        hoursWorkedType: typeof timesheetsData[0].hoursWorked,
        overtimeHours: timesheetsData[0].overtimeHours,
        overtimeHoursType: typeof timesheetsData[0].overtimeHours,
      } : null
    });

    // Group by projects
    const projectsSummary = timesheetsData.reduce((acc, timesheet) => {
      const projectId = timesheet.projectId?.toString() || 'no-project';
      const projectName = timesheet.project?.name || 'No Project';
      
      if (!acc[projectId]) {
        acc[projectId] = {
          id: projectId,
          name: projectName,
          hours: 0,
          overtime: 0,
          days: 0,
        };
      }
      
      const regularHours = typeof timesheet.hoursWorked === 'string' ? parseFloat(timesheet.hoursWorked) : Number(timesheet.hoursWorked) || 0;
      const overtimeHours = typeof timesheet.overtimeHours === 'string' ? parseFloat(timesheet.overtimeHours) : Number(timesheet.overtimeHours) || 0;
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
      projects: Object.values(projectsSummary),
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