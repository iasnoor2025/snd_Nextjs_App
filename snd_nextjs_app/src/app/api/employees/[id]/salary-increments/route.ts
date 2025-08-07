import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

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
    const employeeId = parseInt(id);
    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, first_name: true, last_name: true, employee_id: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const salaryIncrements = await prisma.salaryIncrement.findMany({
      where: { employee_id: employeeId },
      include: {
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
      orderBy: { effective_date: 'desc' },
    });

    return NextResponse.json({ data: salaryIncrements });
  } catch (error) {
    console.error('Error fetching employee salary history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
