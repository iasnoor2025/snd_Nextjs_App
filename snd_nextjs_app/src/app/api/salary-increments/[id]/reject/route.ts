import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const rejectSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = rejectSchema.parse(body);

    const { id } = await params;
    const incrementId = parseInt(id);
    if (isNaN(incrementId)) {
      return NextResponse.json({ error: 'Invalid increment ID' }, { status: 400 });
    }

    // Check if increment exists and is pending
    const increment = await prisma.salaryIncrement.findUnique({
      where: { id: incrementId },
    });

    if (!increment) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    // Check permissions
    const userRole = session.user.role?.toLowerCase();
    const isAdmin = userRole === 'super_admin' || userRole === 'admin' || userRole === 'superadmin';
    
    // Super admin and admin can reject any increment
    // Other users can only reject pending increments
    if (!isAdmin && increment.status !== 'pending') {
      return NextResponse.json({ error: 'Only administrators can reject non-pending increments' }, { status: 403 });
    }

    // Update the increment status to rejected
    const updatedIncrement = await prisma.salaryIncrement.update({
      where: { id: incrementId },
      data: {
        status: 'rejected',
        rejected_by: parseInt(String(session.user.id)),
        rejected_at: new Date(),
        rejection_reason: validatedData.rejection_reason,
        notes: validatedData.notes || increment.notes,
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
        rejected_by_user: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    });

    return NextResponse.json({ data: updatedIncrement }, { status: 200 });
  } catch (error) {
    console.error('Error rejecting salary increment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
