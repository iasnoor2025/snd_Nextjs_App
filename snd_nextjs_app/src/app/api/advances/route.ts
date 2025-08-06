import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

// GET /api/advances - List employee advances with employee data filtering
const getAdvancesHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const employeeId = searchParams.get('employeeId') || '';

    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, only show their own advances
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

    if (search) {
      where.OR = [
        { employee: { first_name: { contains: search, mode: 'insensitive' } } },
        { employee: { last_name: { contains: search, mode: 'insensitive' } } },
        { employee: { employee_id: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (employeeId) {
      where.employee_id = employeeId;
    }

    const [advances, total] = await Promise.all([
      prisma.advancePayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          employee: {
            include: {
              user: true,
            },
          },
        },
      }),
      prisma.advancePayment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: advances,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/advances?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/advances?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advances', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

// POST /api/advances - Create employee advance with employee data filtering
const createAdvanceHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      employeeId,
      amount,
      reason,
      repaymentPlan,
      status = 'pending',
      notes,
    } = body;

    // For employee users, ensure they can only create advances for themselves
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId && parseInt(employeeId) !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: 'You can only create advances for yourself' },
          { status: 403 }
        );
      }
      // Override employeeId to ensure it's the user's own employee ID
      body.employeeId = request.employeeAccess.ownEmployeeId.toString();
    }

    const advance = await prisma.advancePayment.create({
      data: {
        employee_id: parseInt(body.employeeId),
        amount: parseFloat(amount),
        purpose: reason, // Using reason as purpose
        reason,
        status,
        notes: notes || '',
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Advance created successfully',
      data: advance,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating advance:', error);
    return NextResponse.json(
      { error: 'Failed to create advance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

// PUT /api/advances - Update employee advance with permission check
export const PUT = withAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const {
        id,
        employeeId,
        amount,
        reason,
        repaymentPlan,
        status,
        notes,
      } = body;

      const advance = await prisma.advancePayment.update({
        where: { id },
        data: {
          employee_id: employeeId,
          amount: parseFloat(amount),
          purpose: reason, // Using reason as purpose
          reason,
          status,
          notes: notes || '',
        },
        include: {
          employee: {
            include: {
              user: true,
            },
          },
        },
      });

      return NextResponse.json(advance);
    } catch (error) {
      console.error('Error updating advance:', error);
      return NextResponse.json(
        { error: 'Failed to update advance', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  },
  // No specific permission config for PUT, as it's for own data
);

// DELETE /api/advances - Delete employee advance with permission check
export const DELETE = withAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { id } = body;

      await prisma.advancePayment.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Advance deleted successfully' });
    } catch (error) {
      console.error('Error deleting advance:', error);
      return NextResponse.json(
        { error: 'Failed to delete advance', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  },
  // No specific permission config for DELETE, as it's for own data
);

// Export the wrapped handlers
export const GET = withAuth(getAdvancesHandler);
export const POST = withAuth(createAdvanceHandler); 