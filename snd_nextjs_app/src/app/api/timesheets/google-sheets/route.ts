import { db } from '@/lib/drizzle';
import { employees, timesheets as timesheetsTable, designations } from '@/lib/drizzle/schema';
import { and, asc, desc, eq, gte, lte, SQL, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const employeeFileNumber = searchParams.get('employeeFileNumber');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Allow more records

    // Build filters
    const filters: SQL[] = [];

    // Month filter - Using EXTRACT like payslip system
    if (month) {
      const [year, monthNum] = month.split('-');
      if (year && monthNum) {

        // Use EXTRACT SQL functions like payslip system to avoid timezone issues
        const monthCondition = and(
          sql`EXTRACT(YEAR FROM ${timesheetsTable.date}) = ${parseInt(year)}`,
          sql`EXTRACT(MONTH FROM ${timesheetsTable.date}) = ${parseInt(monthNum)}`
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
      .orderBy(asc(timesheetsTable.date))
      .limit(limit);

    // Debug: Show first few dates to see what we're getting
    if (timesheetsData.length > 0) {

      timesheetsData.slice(0, 5).forEach((ts, index) => {

      });
    }

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
