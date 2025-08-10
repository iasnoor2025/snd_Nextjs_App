import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employees, timesheets, payrolls } from '@/lib/drizzle/schema';
import { eq, and, gte, lt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');
    const start_month = searchParams.get('start_month');
    const end_month = searchParams.get('end_month');

    if (!employee_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Employee ID is required'
        },
        { status: 400 }
      );
    }

    // Get employee data
    const employeeData = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        middleName: employees.middleName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
      })
      .from(employees)
      .where(eq(employees.id, parseInt(employee_id)))
      .limit(1);

    if (!employeeData[0]) {
      return NextResponse.json(
        {
          success: false,
          message: 'Employee not found'
        },
        { status: 404 }
      );
    }

    const employee = employeeData[0];

    // Determine date range
    const now = new Date();
    const startDate = start_month ? new Date(start_month + '-01') : new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const endDate = end_month ? new Date(end_month + '-01') : new Date(now.getFullYear(), now.getMonth(), 1);

    // Generate months to check
    const months: { month: number; year: number; employeeCount: number }[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const month = current.getMonth() + 1;
      const year = current.getFullYear();

      // Check if employee has approved timesheets for this month
      const timesheetsData = await db
        .select({ id: timesheets.id })
        .from(timesheets)
        .where(
          and(
            eq(timesheets.employeeId, employee.id),
            eq(timesheets.status, 'manager_approved'),
            gte(timesheets.date, new Date(year, month - 1, 1)),
            lt(timesheets.date, new Date(year, month, 1))
          )
        );

      // Check if payroll already exists for this month
      const existingPayrollData = await db
        .select({ id: payrolls.id })
        .from(payrolls)
        .where(
          and(
            eq(payrolls.employeeId, employee.id),
            eq(payrolls.month, month),
            eq(payrolls.year, year)
          )
        )
        .limit(1);

      const monthData = {
        year: year,
        month: month,
        name: current.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        has_approved_timesheets: timesheetsData.length > 0,
        has_existing_payroll: !!existingPayrollData[0],
        needs_payroll: timesheetsData.length > 0 && !existingPayrollData[0],
        employeeCount: 1 // Since we're checking for a specific employee
      };

      months.push(monthData);
      current.setMonth(current.getMonth() + 1);
    }

    return NextResponse.json({
      success: true,
      data: months,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim(),
        employee_id: employee.fileNumber
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get months needing payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
