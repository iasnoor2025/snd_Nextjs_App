import { db } from '@/lib/drizzle';
import { employees, payrolls } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Extract ID from the URL path since params are not working
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const payrollId = pathParts[pathParts.length - 2]; // Get the ID from the path
    
    if (!payrollId) {
      return NextResponse.json({ success: false, message: 'Invalid payroll ID' }, { status: 400 });
    }
    const id = parseInt(payrollId);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Invalid payroll ID' }, { status: 400 });
    }

    // Check if payroll exists
    const payrollData = await db
      .select({
        id: payrolls.id,
        status: payrolls.status,
        employeeId: payrolls.employeeId,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
        },
      })
      .from(payrolls)
      .leftJoin(employees, eq(payrolls.employeeId, employees.id))
      .where(eq(payrolls.id, id))
      .limit(1);

    if (!payrollData[0]) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found',
        },
        { status: 404 }
      );
    }

    const payroll = payrollData[0];

    // Check if payroll can be approved
    if (payroll.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          message: `Payroll is already ${payroll.status} and cannot be approved`,
        },
        { status: 400 }
      );
    }

    // Approve the payroll
    const updatedPayrolls = await db
      .update(payrolls)
      .set({
        status: 'approved',
        approvedAt: new Date().toISOString().split('T')[0], // Convert to date format (YYYY-MM-DD)
      })
      .where(eq(payrolls.id, id))
      .returning();

    const updatedPayroll = updatedPayrolls[0];

    return NextResponse.json({
      success: true,
      data: {
        ...updatedPayroll,
        employee: payroll.employee,
      },
      message: 'Payroll approved successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error approving payroll: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
