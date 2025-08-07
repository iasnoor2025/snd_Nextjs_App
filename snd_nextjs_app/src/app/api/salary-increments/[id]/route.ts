import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSalaryIncrementSchema = z.object({
  increment_type: z.enum(['percentage', 'amount', 'promotion', 'annual_review', 'performance', 'market_adjustment']).optional(),
  increment_percentage: z.number().optional(),
  increment_amount: z.number().optional(),
  reason: z.string().optional(),
  effective_date: z.string().optional(),
  notes: z.string().optional(),
  new_base_salary: z.number().optional(),
  new_food_allowance: z.number().optional(),
  new_housing_allowance: z.number().optional(),
  new_transport_allowance: z.number().optional(),
  apply_to_allowances: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const incrementId = parseInt(id);
    if (isNaN(incrementId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const salaryIncrement = await prisma.salaryIncrement.findUnique({
      where: { id: incrementId },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true,
            basic_salary: true,
            food_allowance: true,
            housing_allowance: true,
            transport_allowance: true,
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
    });

    if (!salaryIncrement) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    return NextResponse.json({ data: salaryIncrement });
  } catch (error) {
    console.error('Error fetching salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const incrementId = parseInt(id);
    if (isNaN(incrementId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateSalaryIncrementSchema.parse(body);

    // Check if salary increment exists and is not applied
    const existingIncrement = await prisma.salaryIncrement.findUnique({
      where: { id: incrementId },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true,
            basic_salary: true,
            food_allowance: true,
            housing_allowance: true,
            transport_allowance: true,
          }
        }
      }
    });

    if (!existingIncrement) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    if (existingIncrement.status === 'applied') {
      return NextResponse.json({ error: 'Cannot modify applied salary increment' }, { status: 400 });
    }

    // Recalculate new salary if increment details changed
    let updateData: any = {
      ...validatedData,
    };

    if (validatedData.effective_date) {
      updateData.effective_date = new Date(validatedData.effective_date);
    }

    // If increment type or values changed, recalculate new salary
    if (validatedData.increment_type || validatedData.increment_percentage || validatedData.increment_amount) {
      const currentSalary = {
        base_salary: parseFloat(String(existingIncrement.employee.basic_salary || 0)),
        food_allowance: parseFloat(String(existingIncrement.employee.food_allowance || 0)),
        housing_allowance: parseFloat(String(existingIncrement.employee.housing_allowance || 0)),
        transport_allowance: parseFloat(String(existingIncrement.employee.transport_allowance || 0)),
      };

      let newSalary = {
        base_salary: currentSalary.base_salary,
        food_allowance: currentSalary.food_allowance,
        housing_allowance: currentSalary.housing_allowance,
        transport_allowance: currentSalary.transport_allowance,
      };

      const incrementType = validatedData.increment_type || existingIncrement.increment_type;

      switch (incrementType) {
        case 'percentage':
          const percentage = (validatedData.increment_percentage || parseFloat(String(existingIncrement.increment_percentage || 0))) / 100;
          newSalary.base_salary = currentSalary.base_salary * (1 + percentage);
          
          if (validatedData.apply_to_allowances) {
            newSalary.food_allowance = currentSalary.food_allowance * (1 + percentage);
            newSalary.housing_allowance = currentSalary.housing_allowance * (1 + percentage);
            newSalary.transport_allowance = currentSalary.transport_allowance * (1 + percentage);
          }
          break;

        case 'amount':
          const amount = validatedData.increment_amount || parseFloat(String(existingIncrement.increment_amount || 0));
          newSalary.base_salary = currentSalary.base_salary + amount;
          break;

        case 'promotion':
        case 'annual_review':
        case 'performance':
        case 'market_adjustment':
          newSalary = {
            base_salary: validatedData.new_base_salary || parseFloat(String(existingIncrement.new_base_salary || 0)),
            food_allowance: validatedData.new_food_allowance || parseFloat(String(existingIncrement.new_food_allowance || 0)),
            housing_allowance: validatedData.new_housing_allowance || parseFloat(String(existingIncrement.new_housing_allowance || 0)),
            transport_allowance: validatedData.new_transport_allowance || parseFloat(String(existingIncrement.new_transport_allowance || 0)),
          };
          break;
      }

      updateData = {
        ...updateData,
        new_base_salary: newSalary.base_salary,
        new_food_allowance: newSalary.food_allowance,
        new_housing_allowance: newSalary.housing_allowance,
        new_transport_allowance: newSalary.transport_allowance,
      };
    }

    const updatedIncrement = await prisma.salaryIncrement.update({
      where: { id: incrementId },
      data: updateData,
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

    return NextResponse.json({ data: updatedIncrement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const incrementId = parseInt(id);
    if (isNaN(incrementId)) {
      return NextResponse.json({ error: 'Invalid increment ID' }, { status: 400 });
    }

    // Check if increment exists
    const increment = await prisma.salaryIncrement.findUnique({
      where: { id: incrementId },
    });

    if (!increment) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    // Check permissions
    const userRole = session.user.role?.toLowerCase();
    const isAdmin = userRole === 'super_admin' || userRole === 'admin' || userRole === 'superadmin';
    
    // Super admin and admin can delete any increment
    // Other users can only delete if not applied
    if (!isAdmin && increment.status === 'applied') {
      return NextResponse.json({ 
        error: 'Only administrators can delete applied salary increments' 
      }, { status: 403 });
    }

    // If it's an applied increment, we need to revert the employee's salary
    if (increment.status === 'applied') {
      await prisma.$transaction(async (tx) => {
        // Revert employee's salary to the original values
        await tx.employee.update({
          where: { id: increment.employee_id },
          data: {
            basic_salary: increment.current_base_salary,
            food_allowance: increment.current_food_allowance,
            housing_allowance: increment.current_housing_allowance,
            transport_allowance: increment.current_transport_allowance,
          },
        });

        // Delete the increment record
        await tx.salaryIncrement.delete({
          where: { id: incrementId },
        });
      });

      return NextResponse.json({ 
        message: 'Applied salary increment deleted and employee salary reverted successfully' 
      }, { status: 200 });
    }

    // For non-applied increments, just delete the record
    await prisma.salaryIncrement.delete({
      where: { id: incrementId },
    });

    return NextResponse.json({ 
      message: 'Salary increment deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
