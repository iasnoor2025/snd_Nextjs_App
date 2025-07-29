import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employee_id) }
    });

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          message: 'Employee not found'
        },
        { status: 404 }
      );
    }

    // Determine date range
    const now = new Date();
    const startDate = start_month ? new Date(start_month + '-01') : new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const endDate = end_month ? new Date(end_month + '-01') : new Date(now.getFullYear(), now.getMonth(), 1);

    // Generate months to check
    let months = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      const month = current.getMonth() + 1;
      const year = current.getFullYear();

      // Check if employee has approved timesheets for this month
      const timesheets = await prisma.timesheet.findMany({
        where: {
          employeeId: employee.id,
          status: 'manager_approved',
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1)
          }
        }
      });

      // Check if payroll already exists for this month
      const existingPayroll = await prisma.payroll.findFirst({
        where: {
          employeeId: employee.id,
          month: month,
          year: year
        }
      });

      let monthData = {
        year: year,
        month: month,
        name: current.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        has_approved_timesheets: timesheets.length > 0,
        has_existing_payroll: !!existingPayroll,
        needs_payroll: timesheets.length > 0 && !existingPayroll
      };

      months.push(monthData);
      current.setMonth(current.getMonth() + 1);
    }

    return NextResponse.json({
      success: true,
      data: months,
      employee: {
        id: employee.id,
        name: employee.fullName,
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
