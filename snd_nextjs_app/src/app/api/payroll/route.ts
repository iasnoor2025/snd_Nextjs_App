import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';
import { payrolls as payrollsTable, payrollItems as payrollItemsTable, employees as employeesTable } from '@/lib/drizzle/schema';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const getPayrollHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const employee_id = searchParams.get('employee_id');

    // Build where clause
    const where: any = {};

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, only show their own payroll records
    const filters: any[] = [];
    if (user?.role === 'EMPLOYEE' && user.national_id) {
      const ownEmp = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(eq(employeesTable.iqamaNumber as any, user.national_id))
        .limit(1);
      const ownEmployee = ownEmp[0];
      if (ownEmployee) {
        filters.push(eq(payrollsTable.employeeId, ownEmployee.id as number));
      }
    }

    if (status && status !== 'all') {
      filters.push(eq(payrollsTable.status, status));
    }

    if (month) {
      const [year, monthNum] = month.split('-');
      filters.push(eq(payrollsTable.year, parseInt(year)));
      filters.push(eq(payrollsTable.month, parseInt(monthNum)));
    }

    if (employee_id && employee_id !== 'all') {
      filters.push(eq(payrollsTable.employeeId, parseInt(employee_id)));
    }

    const whereExpr = filters.length ? and(...filters) : undefined;

    // Get total count
    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(payrollsTable)
      .where(whereExpr as any);
    const total = Number((totalRow as any)[0]?.count ?? 0);

    // Calculate pagination
    const skip = (page - 1) * per_page;
    const last_page = Math.ceil(total / per_page);
    const from = skip + 1;
    const to = Math.min(skip + per_page, total);

    // Get payrolls with employee data (Drizzle)
    const payrollRows = await db
      .select({
        id: payrollsTable.id,
        employee_id: payrollsTable.employeeId,
        month: payrollsTable.month,
        year: payrollsTable.year,
        base_salary: payrollsTable.baseSalary,
        overtime_amount: payrollsTable.overtimeAmount,
        bonus_amount: payrollsTable.bonusAmount,
        deduction_amount: payrollsTable.deductionAmount,
        advance_deduction: payrollsTable.advanceDeduction,
        final_amount: payrollsTable.finalAmount,
        total_worked_hours: payrollsTable.totalWorkedHours,
        overtime_hours: payrollsTable.overtimeHours,
        status: payrollsTable.status,
        notes: payrollsTable.notes,
        approved_by: payrollsTable.approvedBy,
        approved_at: payrollsTable.approvedAt,
        paid_by: payrollsTable.paidBy,
        paid_at: payrollsTable.paidAt,
        payment_method: payrollsTable.paymentMethod,
        payment_reference: payrollsTable.paymentReference,
        payment_status: payrollsTable.paymentStatus,
        payment_processed_at: payrollsTable.paymentProcessedAt,
        currency: payrollsTable.currency,
        payroll_run_id: payrollsTable.payrollRunId,
        created_at: payrollsTable.createdAt,
        updated_at: payrollsTable.updatedAt,
        employee: {
          id: employeesTable.id,
          first_name: employeesTable.firstName,
          last_name: employeesTable.lastName,
          email: employeesTable.email,
        },
      })
      .from(payrollsTable)
      .leftJoin(employeesTable, eq(employeesTable.id, payrollsTable.employeeId))
      .where(whereExpr as any)
      .orderBy(desc(payrollsTable.createdAt))
      .offset(skip)
      .limit(per_page);

    const payrollIds = payrollRows.map((p) => p.id);
    let itemsByPayrollId: Record<number, any[]> = {};
    if (payrollIds.length > 0) {
      const itemRows = await db
        .select({
          id: payrollItemsTable.id,
          payroll_id: payrollItemsTable.payrollId,
          type: payrollItemsTable.type,
          description: payrollItemsTable.description,
          amount: payrollItemsTable.amount,
          is_taxable: payrollItemsTable.isTaxable,
          tax_rate: payrollItemsTable.taxRate,
          order: payrollItemsTable.order,
          created_at: payrollItemsTable.createdAt,
          updated_at: payrollItemsTable.updatedAt,
        })
        .from(payrollItemsTable)
        .where(inArray(payrollItemsTable.payrollId, payrollIds as any))
        .orderBy(asc(payrollItemsTable.order));

      itemsByPayrollId = itemRows.reduce((acc: Record<number, any[]>, item) => {
        const key = item.payroll_id as unknown as number;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
    }

    const payrolls = payrollRows.map((p) => ({
      ...p,
      items: itemsByPayrollId[p.id] || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: payrolls,
        current_page: page,
        last_page: last_page,
        per_page: per_page,
        total: total,
        from: from,
        to: to,
        next_page_url: page < last_page ? `/api/payroll?page=${page + 1}` : null,
        prev_page_url: page > 1 ? `/api/payroll?page=${page - 1}` : null,
        first_page_url: '/api/payroll?page=1',
        last_page_url: `/api/payroll?page=${last_page}`,
        path: '/api/payroll',
        links: []
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch payrolls: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
};

const createPayrollHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.employee_id || !body.month || !body.year) {
      return NextResponse.json(
        {
          success: false,
          message: 'Employee ID, month, and year are required'
        },
        { status: 400 }
      );
    }

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, ensure they can only create payroll records for themselves
    if (user?.role === 'EMPLOYEE' && user.national_id) {
      const ownEmp = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(eq(employeesTable.iqamaNumber as any, user.national_id))
        .limit(1);
      const ownEmployee = ownEmp[0];
      if (ownEmployee) {
        if (body.employee_id && parseInt(body.employee_id) !== (ownEmployee.id as number)) {
          return NextResponse.json(
            { error: 'You can only create payroll records for yourself' },
            { status: 403 }
          );
        }
        body.employee_id = ownEmployee.id;
      }
    }

    // Check if payroll already exists for this employee, month, and year
    const existingRows = await db
      .select({ id: payrollsTable.id })
      .from(payrollsTable)
      .where(and(
        eq(payrollsTable.employeeId, Number(body.employee_id)),
        eq(payrollsTable.month, Number(body.month)),
        eq(payrollsTable.year, Number(body.year)),
      ))
      .limit(1);
    const existingPayroll = existingRows[0];

    if (existingPayroll) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll record already exists for this employee, month, and year'
        },
        { status: 409 }
      );
    }

    // Create payroll record (Drizzle)
    const nowIso = new Date().toISOString();
    const inserted = await db
      .insert(payrollsTable)
      .values({
        employeeId: Number(body.employee_id),
        month: Number(body.month),
        year: Number(body.year),
        baseSalary: (body.base_salary != null ? String(Number(body.base_salary)) : undefined) as any,
        finalAmount: (body.final_amount != null ? String(Number(body.final_amount)) : undefined) as any,
        status: body.status || 'pending',
        notes: body.notes || '',
        updatedAt: nowIso,
      })
      .returning({
        id: payrollsTable.id,
        employee_id: payrollsTable.employeeId,
        month: payrollsTable.month,
        year: payrollsTable.year,
        base_salary: payrollsTable.baseSalary,
        final_amount: payrollsTable.finalAmount,
        status: payrollsTable.status,
        notes: payrollsTable.notes,
        created_at: payrollsTable.createdAt,
        updated_at: payrollsTable.updatedAt,
      });
    const payroll = inserted[0];

    return NextResponse.json({
      success: true,
      message: 'Payroll record created successfully',
      data: payroll
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create payroll record: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
};

// Export the wrapped handlers
export const GET = withAuth(getPayrollHandler);
export const POST = withAuth(createPayrollHandler);
