import { db } from '@/lib/drizzle';
import { advancePayments, designations, employees } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, eq, isNull } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const getAdvanceReceiptHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; advanceId: string }> }
) => {
  try {
    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const advanceId = parseInt(resolvedParams.advanceId);

    if (!employeeId || !advanceId) {
      return NextResponse.json(
        { error: 'Employee ID and Advance ID are required' },
        { status: 400 }
      );
    }

    // Get session to check user role
    const session = await getServerSession();
    const user = session?.user;

    // For employee users, ensure they can only access their own advance data
    if (user?.role === 'EMPLOYEE') {
      try {
        const [ownEmployee] = await db
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.userId, parseInt(user.id)))
          .limit(1);
        if (ownEmployee && employeeId !== ownEmployee.id) {
          return NextResponse.json(
            { error: 'You can only access your own advance data' },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('Error finding employee for user:', error);
        return NextResponse.json(
          { error: 'Access denied. Employee not found.' },
          { status: 403 }
        );
      }
    }

    // Get the advance record
    const advanceRecord = await db
      .select({
        id: advancePayments.id,
        amount: advancePayments.amount,
        purpose: advancePayments.purpose,
        reason: advancePayments.reason,
        status: advancePayments.status,
        paymentDate: advancePayments.paymentDate,
        repaidAmount: advancePayments.repaidAmount,
        monthlyDeduction: advancePayments.monthlyDeduction,
        createdAt: advancePayments.createdAt,
        approvedAt: advancePayments.approvedAt,
        notes: advancePayments.notes,
      })
      .from(advancePayments)
      .where(
        and(
          eq(advancePayments.id, advanceId),
          eq(advancePayments.employeeId, employeeId),
          isNull(advancePayments.deletedAt)
        )
      )
      .limit(1);

    if (!advanceRecord.length) {
      return NextResponse.json({ error: 'Advance record not found' }, { status: 404 });
    }

    // Get employee information
    const employee = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        fileNumber: employees.fileNumber,
        designation: {
          name: designations.name,
        },
      })
      .from(employees)
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!employee || employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employeeData = employee[0];

    if (!employeeData) {
      return NextResponse.json({ error: 'Employee data not found' }, { status: 404 });
    }

    // Get company information
    const company = {
      name: process.env.NEXT_PUBLIC_APP_NAME || 'Your Company Name',
      address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || 'Company Address',
      phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || 'Company Phone',
      email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'company@example.com',
    };

    const advance = advanceRecord[0];

    if (!advance) {
      return NextResponse.json({ error: 'Advance record not found' }, { status: 404 });
    }

    const receiptData = {
      advance: {
        id: advance.id,
        amount: Number(advance.amount),
        reason: advance.reason || advance.purpose,
        purpose: advance.purpose,
        status: advance.status,
        payment_date: advance.paymentDate
          ? typeof advance.paymentDate === 'string'
            ? advance.paymentDate.slice(0, 10)
            : new Date(advance.paymentDate).toISOString().slice(0, 10)
          : null,
        repaid_amount: Number(advance.repaidAmount || 0),
        monthly_deduction: advance.monthlyDeduction ? Number(advance.monthlyDeduction) : null,
        balance: Number(advance.amount) - Number(advance.repaidAmount || 0),
        created_at:
          typeof advance.createdAt === 'string'
            ? advance.createdAt.slice(0, 19).replace('T', ' ')
            : new Date(advance.createdAt).toISOString().slice(0, 19).replace('T', ' '),
        approved_at: advance.approvedAt
          ? typeof advance.approvedAt === 'string'
            ? advance.approvedAt.slice(0, 10)
            : new Date(advance.approvedAt).toISOString().slice(0, 10)
          : null,
        notes: advance.notes,
      },
      employee: {
        id: employeeData.id,
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        position: employeeData.designation?.name || 'Employee',
        employee_id: employeeData.fileNumber,
      },
      company: company,
    };

    return NextResponse.json({
      success: true,
      receipt: receiptData,
    });
  } catch (error) {
    console.error('Error fetching advance receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch advance receipt' }, { status: 500 });
  }
};

// Export the wrapped handler
export const GET = withPermission(PermissionConfigs.advance.read)(getAdvanceReceiptHandler);

