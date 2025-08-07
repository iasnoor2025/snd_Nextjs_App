import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const salaryIncrement = await prisma.salaryIncrement.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!salaryIncrement) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    if (salaryIncrement.status !== 'approved') {
      return NextResponse.json({ error: 'Salary increment must be approved before applying' }, { status: 400 });
    }

    if (salaryIncrement.effective_date > new Date()) {
      return NextResponse.json({ error: 'Cannot apply salary increment before effective date' }, { status: 400 });
    }

    // Apply the salary increment
    await prisma.$transaction(async (tx) => {
      // Create new salary record
      await tx.employeeSalary.create({
        data: {
          employee_id: salaryIncrement.employee_id,
          base_salary: salaryIncrement.new_base_salary,
          food_allowance: salaryIncrement.new_food_allowance,
          housing_allowance: salaryIncrement.new_housing_allowance,
          transport_allowance: salaryIncrement.new_transport_allowance,
          effective_from: salaryIncrement.effective_date,
          reason: `Salary increment: ${salaryIncrement.reason}`,
          approved_by: salaryIncrement.approved_by,
          approved_at: new Date(),
          status: 'approved',
        },
      });

      // Update employee's basic salary
      await tx.employee.update({
        where: { id: salaryIncrement.employee_id },
        data: {
          basic_salary: salaryIncrement.new_base_salary,
          food_allowance: salaryIncrement.new_food_allowance,
          housing_allowance: salaryIncrement.new_housing_allowance,
          transport_allowance: salaryIncrement.new_transport_allowance,
        },
      });

      // Mark increment as applied
      await tx.salaryIncrement.update({
        where: { id },
        data: {
          status: 'applied',
        },
      });
    });

    const updatedIncrement = await prisma.salaryIncrement.findUnique({
      where: { id },
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
      },
    });

    return NextResponse.json({ data: updatedIncrement });
  } catch (error) {
    console.error('Error applying salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
