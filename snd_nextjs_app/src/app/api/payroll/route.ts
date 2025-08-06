import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

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
    if (user?.role === 'EMPLOYEE') {
      // Find employee record that matches user's national_id
      const ownEmployee = await prisma.employee.findFirst({
        where: { iqama_number: user.national_id },
        select: { id: true },
      });
      if (ownEmployee) {
        where.employee_id = ownEmployee.id;
      }
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (month) {
      const [year, monthNum] = month.split('-');
      where.year = parseInt(year);
      where.month = parseInt(monthNum);
    }

    if (employee_id && employee_id !== 'all') {
      where.employee_id = parseInt(employee_id);
    }

    // Get total count
    const total = await prisma.payroll.count({ where });

    // Calculate pagination
    const skip = (page - 1) * per_page;
    const last_page = Math.ceil(total / per_page);
    const from = skip + 1;
    const to = Math.min(skip + per_page, total);

    // Get payrolls with employee data
    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: true,
        items: {
          orderBy: { order: 'asc' }
        }
      },
      skip,
      take: per_page,
      orderBy: { created_at: 'desc' }
    });

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
    if (user?.role === 'EMPLOYEE') {
      // Find employee record that matches user's national_id
      const ownEmployee = await prisma.employee.findFirst({
        where: { iqama_number: user.national_id },
        select: { id: true },
      });
      if (ownEmployee) {
        if (body.employee_id && parseInt(body.employee_id) !== ownEmployee.id) {
          return NextResponse.json(
            { error: 'You can only create payroll records for yourself' },
            { status: 403 }
          );
        }
        // Override employee_id to ensure it's the user's own employee ID
        body.employee_id = ownEmployee.id;
      }
    }

    // Check if payroll already exists for this employee, month, and year
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        employee_id: body.employee_id,
        month: body.month,
        year: body.year,
      }
    });

    if (existingPayroll) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll record already exists for this employee, month, and year'
        },
        { status: 409 }
      );
    }

    // Create payroll record
    const payroll = await prisma.payroll.create({
      data: {
        employee_id: body.employee_id,
        month: body.month,
        year: body.year,
        base_salary: body.base_salary || 0,
        final_amount: body.final_amount || 0,
        status: body.status || 'pending',
        notes: body.notes || '',
      },
      include: {
        employee: true,
        items: true
      }
    });

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
