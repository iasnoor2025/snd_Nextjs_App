import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const employee_id = searchParams.get('employee_id');

    // Build where clause
    const where: any = {};

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
}

export async function POST(request: NextRequest) {
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

    // Check if payroll already exists for this employee and month
    const existingPayroll = await prisma.payroll.findUnique({
      where: {
        employee_id_month_year: {
          employee_id: parseInt(body.employee_id),
          month: parseInt(body.month),
          year: parseInt(body.year)
        }
      }
    });

    if (existingPayroll) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payroll already exists for this employee and month'
        },
        { status: 400 }
      );
    }

    // Get employee data
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(body.employee_id) }
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

    // Create payroll
    const newPayroll = await prisma.payroll.create({
      data: {
        employee_id: parseInt(body.employee_id),
        month: parseInt(body.month),
        year: parseInt(body.year),
        base_salary: body.base_salary || employee.basic_salary,
        overtime_amount: body.overtime_amount || 0,
        bonus_amount: body.bonus_amount || 0,
        deduction_amount: body.deduction_amount || 0,
        advance_deduction: body.advance_deduction || 0,
        final_amount: (body.base_salary || employee.basic_salary) +
                     (body.overtime_amount || 0) +
                     (body.bonus_amount || 0) -
                     (body.deduction_amount || 0) -
                     (body.advance_deduction || 0),
        total_worked_hours: body.total_worked_hours || 160,
        overtime_hours: body.overtime_hours || 0,
        status: 'pending',
        notes: body.notes || '',
        currency: 'USD'
      },
      include: {
        employee: true,
        items: true
      }
    });

    // Create payroll items if provided
    if (body.items && Array.isArray(body.items)) {
      await prisma.payrollItem.createMany({
        data: body.items.map((item: any, index: number) => ({
          payroll_id: newPayroll.id,
          type: item.type,
          description: item.description,
          amount: item.amount,
          is_taxable: item.is_taxable !== undefined ? item.is_taxable : true,
          tax_rate: item.tax_rate || 0,
          order: item.order || index + 1
        }))
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll created successfully',
      data: newPayroll
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create payroll: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
