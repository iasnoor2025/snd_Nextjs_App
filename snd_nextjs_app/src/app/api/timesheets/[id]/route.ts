import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: {
            user: true
          }
        },
        project: true,
        rental: true,
        assignment: true,
        foremanApprover: true,
        inchargeApprover: true,
        checkingApprover: true,
        managerApprover: true,
        rejector: true
      }
    });

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    return NextResponse.json({ timesheet });
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if timesheet exists
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id: params.id }
    });

    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }

    // Check user role from request headers or session
    const userRole = request.headers.get('x-user-role') || 'USER'; // Default to USER if not provided

    // Only admin can delete non-draft timesheets
    if (existingTimesheet.status !== 'draft' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only draft timesheets can be deleted by non-admin users' },
        { status: 400 }
      );
    }

    // Delete the timesheet
    await prisma.timesheet.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Timesheet deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
