import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees, departments, designations } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { authConfig } from '@/lib/auth-config';

// GET /api/leave-requests/[id] - Get a specific leave request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the leave request with employee details using Drizzle
    const [leaveRequest] = await db
      .select({
        id: employeeLeaves.id,
        leaveType: employeeLeaves.leaveType,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate,
        days: employeeLeaves.days,
        reason: employeeLeaves.reason,
        status: employeeLeaves.status,
        approvedBy: employeeLeaves.approvedBy,
        approvedAt: employeeLeaves.approvedAt,
        rejectedBy: employeeLeaves.rejectedBy,
        rejectedAt: employeeLeaves.rejectedAt,
        rejectionReason: employeeLeaves.rejectionReason,
        createdAt: employeeLeaves.createdAt,
        updatedAt: employeeLeaves.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone,
          departmentId: employees.departmentId,
          designationId: employees.designationId,
        },
        department: {
          id: departments.id,
          name: departments.name,
        },
        designation: {
          id: designations.id,
          name: designations.name,
        },
      })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employeeLeaves.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employeeLeaves.id, parseInt(id)))
      .limit(1);

    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    // Transform the data for the frontend
    const transformedLeaveRequest = {
      id: leaveRequest.id.toString(),
      employee_name: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
      employee_id: leaveRequest.employee.id,
      leave_type: leaveRequest.leaveType,
      start_date: leaveRequest.startDate.toISOString().split('T')[0],
      end_date: leaveRequest.endDate.toISOString().split('T')[0],
      days_requested: leaveRequest.days,
      reason: leaveRequest.reason,
      status: leaveRequest.status.charAt(0).toUpperCase() + leaveRequest.status.slice(1).toLowerCase(),
      submitted_date: leaveRequest.createdAt.toISOString(),
      approved_by: leaveRequest.approvedBy?.toString() || null,
      approved_date: leaveRequest.approvedAt?.toISOString() || null,
      rejected_by: leaveRequest.rejectedBy?.toString() || null,
      rejected_at: leaveRequest.rejectedAt?.toISOString() || null,
      rejection_reason: leaveRequest.rejectionReason || null,
      comments: null, // Not implemented in current schema
      created_at: leaveRequest.createdAt.toISOString(),
      updated_at: leaveRequest.updatedAt.toISOString(),
      department: leaveRequest.department?.name,
      position: leaveRequest.designation?.name,
      total_leave_balance: 20, // Default leave balance - should be calculated from employee's leave policy
      leave_taken_this_year: 0, // Should be calculated from approved leaves this year
      attachments: [], // Not implemented in current schema
      approval_history: [
        {
          id: "1",
          action: leaveRequest.status === 'pending' ? 'Submitted' : 
                  leaveRequest.status === 'approved' ? 'Approved' : 
                  leaveRequest.status === 'rejected' ? 'Rejected' : 'Submitted',
          approver: leaveRequest.employee.firstName + ' ' + leaveRequest.employee.lastName,
          date: leaveRequest.createdAt.toISOString(),
          comments: leaveRequest.status === 'pending' ? 'Leave request submitted for approval' :
                   leaveRequest.status === 'rejected' ? `Leave request rejected: ${leaveRequest.rejectionReason || 'No reason provided'}` :
                   'Leave request submitted for approval'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: transformedLeaveRequest,
    });

  } catch (error) {
    console.error('❌ Error fetching leave request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/leave-requests/[id] - Delete a leave request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has permission to delete leave requests
    // Allow SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR, EMPLOYEE roles
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'EMPLOYEE'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions to delete leave requests.' },
        { status: 403 }
      );
    }

    // Check if leave request exists
    const existingLeaveRequest = await prisma.employeeLeave.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingLeaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    // Delete the leave request
    await prisma.employeeLeave.delete({
      where: { id: parseInt(id) },
    });

    console.log('✅ Leave request deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully',
    });

  } catch (error) {
    console.error('❌ Error deleting leave request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/leave-requests/[id] - Update a leave request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { leave_type, start_date, end_date, days, reason, status, comments } = body;

    // Validate required fields
    if (!leave_type || !start_date || !end_date || !days || !reason || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate dates
    if (new Date(start_date) > new Date(end_date)) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    // Check if leave request exists
    const existingLeave = await prisma.employeeLeave.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: true,
      },
    });

    if (!existingLeave) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    // Update the leave request
    const updatedLeave = await prisma.employeeLeave.update({
      where: { id: parseInt(id) },
      data: {
        leave_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        days,
        reason,
        status,
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

    return NextResponse.json({
      success: true,
      data: {
        id: updatedLeave.id.toString(),
        leave_type: updatedLeave.leave_type,
        start_date: updatedLeave.start_date.toISOString().split('T')[0],
        end_date: updatedLeave.end_date.toISOString().split('T')[0],
        days: updatedLeave.days,
        reason: updatedLeave.reason,
        status: updatedLeave.status,
        employee: {
          name: `${updatedLeave.employee.first_name} ${updatedLeave.employee.last_name}`,
          employee_id: updatedLeave.employee.employee_id,
        },
        created_at: updatedLeave.created_at.toISOString(),
        updated_at: updatedLeave.updated_at.toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error updating leave request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
