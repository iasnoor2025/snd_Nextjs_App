import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { payrolls, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: payrollId } = await params;
    const id = parseInt(payrollId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payroll ID' },
        { status: 400 }
      );
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
        }
      })
      .from(payrolls)
      .leftJoin(employees, eq(payrolls.employeeId, employees.id))
      .where(eq(payrolls.id, id))
      .limit(1);

    if (!payrollData[0]) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll not found'
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
          message: `Payroll is already ${payroll.status} and cannot be approved`
        },
        { status: 400 }
      );
    }

    // Approve the payroll
    const updatedPayrolls = await db
      .update(payrolls)
      .set({
        status: 'approved',
        approvedBy: 1, // Mock user ID - in real app, get from session
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(payrolls.id, id))
      .returning();

    const updatedPayroll = updatedPayrolls[0];

    return NextResponse.json({
      success: true,
      data: {
        ...updatedPayroll,
        employee: payroll.employee
      },
      message: 'Payroll approved successfully'
    });
  } catch (error) {
    console.error('Error approving payroll:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error approving payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
