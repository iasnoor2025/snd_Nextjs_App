import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timesheets, employees, users, projects as projectsTable, rentals, employeeAssignments } from '@/lib/drizzle/schema';
import { and, eq, gte, lte, isNull, asc, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/rbac/api-middleware';

export const GET = withAuth(async (request: NextRequest) => {
  try {

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM format
    const employeeId = searchParams.get('employeeId') || '';

    // Parse month
    const [year, monthNum] = month.split('-');
    if (!year || !monthNum) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);

    // Build query using date range filtering instead of EXTRACT
    const whereConditions: any[] = [
      gte(timesheets.date, startDate.toISOString()),
      lte(timesheets.date, endDate.toISOString()),
    ];

    // If employeeId is provided, filter by employee
    if (employeeId) {
      // Convert to number if it's a string, since database expects number
      const empId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId;
      whereConditions.push(eq(timesheets.employeeId, empId));
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
        // Employee fields
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeFileNumber: employees.fileNumber,
        // User fields
        userName: users.name,
        userEmail: users.email,
        // Project fields
        projectName: projectsTable.name,
        // Rental fields
        rentalNumber: rentals.rentalNumber,
        // Assignment fields
        assignmentName: employeeAssignments.name,
        assignmentType: employeeAssignments.type,
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(projectsTable, eq(timesheets.projectId, projectsTable.id))
      .leftJoin(rentals, eq(timesheets.rentalId, rentals.id))
      .leftJoin(employeeAssignments, eq(timesheets.assignmentId, employeeAssignments.id))
      .where(and(...whereConditions))
      .orderBy(asc(timesheets.date)) as any[];



    // Create calendar data
    const calendar: { [key: string]: any } = {};
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    


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
      // Extract just the date part from the timesheet date string
      let dateStr = '';
      if (timesheet.date) {
        const dateString = String(timesheet.date);
        // Handle both '2025-08-01 00:00:00' and '2025-08-01T00:00:00.000Z' formats
        if (dateString.includes(' ')) {
          // Format: '2025-08-01 00:00:00'
          dateStr = dateString.split(' ')[0];
        } else if (dateString.includes('T')) {
          // Format: '2025-08-01T00:00:00.000Z'
          dateStr = dateString.split('T')[0];
        } else {
          // Format: '2025-08-01'
          dateStr = dateString;
        }
      }
      
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
            id: timesheet.employeeId.toString(),
            firstName: timesheet.employeeFirstName,
            lastName: timesheet.employeeLastName,
            fileNumber: timesheet.employeeFileNumber,
            user: timesheet.userName ? {
              name: timesheet.userName,
              email: timesheet.userEmail,
            } : undefined,
          },
          project: timesheet.projectId ? {
            id: timesheet.projectId.toString(),
            name: timesheet.projectName,
          } : undefined,
          rental: timesheet.rentalId ? {
            id: timesheet.rentalId.toString(),
            rentalNumber: timesheet.rentalNumber,
          } : undefined,
          assignment: timesheet.assignmentId ? {
            id: timesheet.assignmentId.toString(),
            name: timesheet.assignmentName || '',
            type: timesheet.assignmentType,
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



    // Group by projects
    const projectsSummary = timesheetsData.reduce((acc, timesheet) => {
      const projectId = timesheet.projectId?.toString() || 'no-project';
      const projectName = timesheet.projectName || 'No Project';
      
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
      // Use the month parameters directly to avoid timezone issues
      month: new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };



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
});
