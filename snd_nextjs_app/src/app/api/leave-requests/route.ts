import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authConfig } from '@/lib/auth-config';

// POST /api/leave-requests - Create a new leave request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      employee_id,
      leave_type,
      start_date,
      end_date,
      days,
      reason,
    } = body;

    // Validate required fields
    if (!employee_id || !leave_type || !start_date || !end_date || !days) {
      return NextResponse.json(
        { error: 'Missing required fields: employee_id, leave_type, start_date, end_date, days' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employee_id) },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Create the leave request
    const leaveRequest = await prisma.employeeLeave.create({
      data: {
        employee_id: parseInt(employee_id),
        leave_type,
        start_date: startDate,
        end_date: endDate,
        days: parseInt(days),
        reason: reason || null,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_id: true,
          },
        },
      },
    });

    console.log('✅ Leave request created:', leaveRequest.id);

    return NextResponse.json({
      success: true,
      message: 'Leave request created successfully',
      data: {
        id: leaveRequest.id,
        employee_name: `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`,
        employee_id: leaveRequest.employee.employee_id,
        leave_type: leaveRequest.leave_type,
        start_date: leaveRequest.start_date,
        end_date: leaveRequest.end_date,
        days: leaveRequest.days,
        reason: leaveRequest.reason,
        status: leaveRequest.status,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating leave request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
