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

    const incrementId = parseInt(params.id);
    if (isNaN(incrementId)) {
      return NextResponse.json({ error: 'Invalid increment ID' }, { status: 400 });
    }

    // Check if increment exists and is approved
    const increment = await prisma.salaryIncrement.findUnique({
      where: { id: incrementId },
      include: {
        employee: true,
      },
    });

    if (!increment) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    if (increment.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved increments can be applied' }, { status: 400 });
    }

    // Check permissions
    const userRole = session.user.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin';
    
    // Super admin and admin can apply any approved increment
    // Other users can only apply if effective date has passed
    if (!isAdmin && new Date(increment.effective_date) > new Date()) {
      return NextResponse.json({ error: 'Cannot apply salary increment before effective date' }, { status: 400 });
    }

    // Start a transaction to update both the increment and employee salary
    const result = await prisma.$transaction(async (tx) => {
      // Update the increment status to applied
      const updatedIncrement = await tx.salaryIncrement.update({
        where: { id: incrementId },
        data: {
          status: 'applied',
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
          approved_by_user: {
            select: {
              id: true,
              name: true,
            }
          },
        },
      });

      // Update the employee's salary with the new values
      await tx.employee.update({
        where: { id: increment.employee_id },
        data: {
          basic_salary: increment.new_base_salary,
          food_allowance: increment.new_food_allowance,
          housing_allowance: increment.new_housing_allowance,
          transport_allowance: increment.new_transport_allowance,
        },
      });

      return updatedIncrement;
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    console.error('Error applying salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
