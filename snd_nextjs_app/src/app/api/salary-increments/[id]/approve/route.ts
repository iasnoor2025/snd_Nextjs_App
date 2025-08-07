import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const approveSchema = z.object({
  notes: z.string().optional(),
});

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

    const body = await request.json();
    const validatedData = approveSchema.parse(body);

    const salaryIncrement = await prisma.salaryIncrement.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!salaryIncrement) {
      return NextResponse.json({ error: 'Salary increment not found' }, { status: 404 });
    }

    if (salaryIncrement.status !== 'pending') {
      return NextResponse.json({ error: 'Salary increment cannot be approved' }, { status: 400 });
    }

    if (salaryIncrement.effective_date < new Date()) {
      return NextResponse.json({ error: 'Cannot approve salary increment with past effective date' }, { status: 400 });
    }

    const updatedIncrement = await prisma.salaryIncrement.update({
      where: { id },
      data: {
        status: 'approved',
        approved_by: session.user.id,
        approved_at: new Date(),
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error approving salary increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
