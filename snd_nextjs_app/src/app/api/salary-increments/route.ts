import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createSalaryIncrementSchema = z.object({
  employee_id: z.number(),
  increment_type: z.enum(['percentage', 'amount', 'promotion', 'annual_review', 'performance', 'market_adjustment']),
  increment_percentage: z.number().optional(),
  increment_amount: z.number().optional(),
  reason: z.string(),
  effective_date: z.string(),
  notes: z.string().optional(),
  new_base_salary: z.number().optional(),
  new_food_allowance: z.number().optional(),
  new_housing_allowance: z.number().optional(),
  new_transport_allowance: z.number().optional(),
  apply_to_allowances: z.boolean().optional(),
});

const updateSalaryIncrementSchema = createSalaryIncrementSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const employee_id = searchParams.get('employee_id');
    const status = searchParams.get('status');
    const increment_type = searchParams.get('increment_type');
    const effective_date_from = searchParams.get('effective_date_from');
    const effective_date_to = searchParams.get('effective_date_to');

    const where: any = {};

    if (employee_id) where.employee_id = parseInt(employee_id);
    if (status) where.status = status;
    if (increment_type) where.increment_type = increment_type;
    if (effective_date_from) where.effective_date = { gte: new Date(effective_date_from) };
    if (effective_date_to) {
      where.effective_date = {
        ...where.effective_date,
        lte: new Date(effective_date_to)
      };
    }

    const skip = (page - 1) * limit;

    const [increments, total] = await Promise.all([
      prisma.salaryIncrement.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              employee_id: true,
            }
          },
          requested_by_user: {
            select: {
              id: true,
              name: true,
            }
          },
          approved_by_user: {
            select: {
              id: true,
              name: true,
            }
          },
          rejected_by_user: {
            select: {
              id: true,
              name: true,
            }
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salaryIncrement.count({ where }),
    ]);

    return NextResponse.json({
      data: increments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching salary increments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSalaryIncrementSchema.parse(body);

    // Get current salary details for the employee
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employee_id },
      include: {
        salaries: {
          where: {
            status: 'approved',
            effective_from: { lte: new Date() },
            OR: [
              { effective_to: null },
              { effective_to: { gte: new Date() } }
            ]
          },
          orderBy: { effective_from: 'desc' },
          take: 1,
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get current salary details
    const currentSalary = employee.salaries[0] || {
      base_salary: employee.basic_salary,
      food_allowance: employee.food_allowance,
      housing_allowance: employee.housing_allowance,
      transport_allowance: employee.transport_allowance,
    };

    // Calculate new salary based on increment type
    let newSalary = {
      base_salary: currentSalary.base_salary,
      food_allowance: currentSalary.food_allowance,
      housing_allowance: currentSalary.housing_allowance,
      transport_allowance: currentSalary.transport_allowance,
    };

    switch (validatedData.increment_type) {
      case 'percentage':
        if (!validatedData.increment_percentage) {
          return NextResponse.json({ error: 'Percentage is required for percentage increment' }, { status: 400 });
        }
        const percentage = validatedData.increment_percentage / 100;
        newSalary.base_salary = currentSalary.base_salary * (1 + percentage);
        
        if (validatedData.apply_to_allowances) {
          newSalary.food_allowance = currentSalary.food_allowance * (1 + percentage);
          newSalary.housing_allowance = currentSalary.housing_allowance * (1 + percentage);
          newSalary.transport_allowance = currentSalary.transport_allowance * (1 + percentage);
        }
        break;

      case 'amount':
        if (!validatedData.increment_amount) {
          return NextResponse.json({ error: 'Amount is required for amount increment' }, { status: 400 });
        }
        newSalary.base_salary = currentSalary.base_salary + validatedData.increment_amount;
        break;

      case 'promotion':
      case 'annual_review':
      case 'performance':
      case 'market_adjustment':
        newSalary = {
          base_salary: validatedData.new_base_salary || currentSalary.base_salary,
          food_allowance: validatedData.new_food_allowance || currentSalary.food_allowance,
          housing_allowance: validatedData.new_housing_allowance || currentSalary.housing_allowance,
          transport_allowance: validatedData.new_transport_allowance || currentSalary.transport_allowance,
        };
        break;
    }

    const salaryIncrement = await prisma.salaryIncrement.create({
      data: {
        employee_id: validatedData.employee_id,
        current_base_salary: currentSalary.base_salary,
        current_food_allowance: currentSalary.food_allowance,
        current_housing_allowance: currentSalary.housing_allowance,
        current_transport_allowance: currentSalary.transport_allowance,
        new_base_salary: newSalary.base_salary,
        new_food_allowance: newSalary.food_allowance,
        new_housing_allowance: newSalary.housing_allowance,
        new_transport_allowance: newSalary.transport_allowance,
        increment_type: validatedData.increment_type,
        increment_percentage: validatedData.increment_percentage,
        increment_amount: validatedData.increment_amount,
        reason: validatedData.reason,
        effective_date: new Date(validatedData.effective_date),
        requested_by: session.user.id,
        notes: validatedData.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true,
          }
        },
        requested_by_user: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    });

    return NextResponse.json({ data: salaryIncrement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
