import { db } from '@/lib/drizzle';
import { employees, timesheets as timesheetsTable, designations } from '@/lib/drizzle/schema';
import { and, desc, eq, gte, lte, SQL } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const employeeFileNumber = searchParams.get('employeeFileNumber');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Allow more records

    console.log('Google Sheets API called with:', { month, employeeFileNumber, limit });

    // Build filters
    const filters: SQL[] = [];

    // Month filter - FIXED VERSION
    if (month) {
      const [year, monthNum] = month.split('-');
      if (year && monthNum) {
        // Use proper date range instead of EXTRACT to avoid timezone issues
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum) + 1, 0, 23, 59, 59, 999);
        
        console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString());
        
        const monthCondition = and(
          gte(timesheetsTable.date, startDate.toISOString()),
          lte(timesheetsTable.date, endDate.toISOString())
        );
        if (monthCondition) {
          filters.push(monthCondition);
        }
      }
    }

    // Employee file number filter
    if (employeeFileNumber) {
      filters.push(eq(employees.fileNumber, employeeFileNumber));
    }

    const conditions = filters.length ? and(...filters) : undefined;

    // Fetch timesheet data with proper filtering
    const timesheetsData = await db
      .select({
        id: timesheetsTable.id,
        employeeId: timesheetsTable.employeeId,
        date: timesheetsTable.date,
        hoursWorked: timesheetsTable.hoursWorked,
        overtimeHours: timesheetsTable.overtimeHours,
        startTime: timesheetsTable.startTime,
        endTime: timesheetsTable.endTime,
        status: timesheetsTable.status,
        assignmentId: timesheetsTable.assignmentId,
        description: timesheetsTable.description,
        project: timesheetsTable.project,
        tasks: timesheetsTable.tasks,
        createdAt: timesheetsTable.createdAt,
        updatedAt: timesheetsTable.updatedAt,
        // Employee data
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          nationality: employees.nationality,
          designationId: employees.designationId,
          designationName: designations.name,
          basicSalary: employees.basicSalary,
        },
      })
      .from(timesheetsTable)
      .leftJoin(employees, eq(timesheetsTable.employeeId, employees.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(conditions)
      .orderBy(desc(timesheetsTable.date))
      .limit(limit);

    console.log('Found timesheets:', timesheetsData.length);

    // Transform data for Google Sheets
    const transformedData = timesheetsData.map(ts => ({
      id: ts.id.toString(),
      employeeId: ts.employeeId?.toString() || '',
      date: ts.date ? new Date(ts.date).toISOString().split('T')[0] : '',
      hoursWorked: ts.hoursWorked || '0',
      overtimeHours: ts.overtimeHours || '0',
      startTime: ts.startTime ? new Date(ts.startTime).toISOString() : '',
      endTime: ts.endTime ? new Date(ts.endTime).toISOString() : '',
      status: ts.status || '',
      assignmentId: ts.assignmentId?.toString() || '',
      description: ts.description || '',
      project: ts.project || '',
      tasks: ts.tasks || '',
      createdAt: ts.createdAt ? new Date(ts.createdAt).toISOString() : '',
      updatedAt: ts.updatedAt ? new Date(ts.updatedAt).toISOString() : '',
      employee: ts.employee ? {
        id: ts.employee.id?.toString() || '',
        firstName: ts.employee.firstName || '',
        lastName: ts.employee.lastName || '',
        fileNumber: ts.employee.fileNumber || '',
        nationality: ts.employee.nationality || '',
        designation: ts.employee.designationName || '',
        basicSalary: ts.employee.basicSalary || '',
        advanceMoney: '0', // We'll calculate this separately if needed
      } : null,
    }));

    // Show available months for debugging
    const allMonths = [...new Set(timesheetsData.map(ts => {
      const date = ts.date ? new Date(ts.date).toISOString().substring(0, 7) : '';
      return date;
    }))];

    return NextResponse.json({
      data: transformedData,
      total: transformedData.length,
      filters: {
        month,
        employeeFileNumber,
        limit,
      },
      availableMonths: allMonths,
      message: 'Google Sheets API - Data fetched successfully',
    });

  } catch (error) {
    console.error('Google Sheets API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch timesheet data for Google Sheets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
