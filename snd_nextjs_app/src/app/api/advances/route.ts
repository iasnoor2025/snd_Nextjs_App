import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// GET /api/advances - List employee advances with permission check
export const GET = withPermission(
  async (request: NextRequest) => {
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
  },
  PermissionConfigs.advance.read
);

// POST /api/advances - Create employee advance with permission check
export const POST = withPermission(
  async (request: NextRequest) => {
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

      const advance = await prisma.advancePayment.create({
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

      return NextResponse.json(advance, { status: 201 });
    } catch (error) {
      console.error('Error creating advance:', error);
      return NextResponse.json(
        { error: 'Failed to create advance', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.advance.create
);

// PUT /api/advances - Update employee advance with permission check
export const PUT = withPermission(
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
  PermissionConfigs.advance.update
);

// DELETE /api/advances - Delete employee advance with permission check
export const DELETE = withPermission(
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
  PermissionConfigs.advance.delete
); 