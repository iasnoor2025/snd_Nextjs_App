import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { departments, designations, employeeLeaves, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// GET /api/leave-requests/[id] - Get a specific leave request
export async function GET({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Transform the data for the frontend
    const transformedLeaveRequest = {
      id: leaveRequest.id.toString(),
      employee_name: `${leaveRequest.employee?.firstName} ${leaveRequest.employee?.lastName}`,
      employee_id: leaveRequest.employee?.id,
      leave_type: leaveRequest.leaveType,
      start_date: leaveRequest.startDate.split('T')[0],
      end_date: leaveRequest.endDate.split('T')[0],
      days_requested: leaveRequest.days,
      reason: leaveRequest.reason,
      status:
        leaveRequest.status.charAt(0).toUpperCase() + leaveRequest.status.slice(1).toLowerCase(),
      submitted_date: leaveRequest.createdAt,
      approved_by: leaveRequest.approvedBy?.toString() || null,
      approved_date: leaveRequest.approvedAt || null,
      rejected_by: leaveRequest.rejectedBy?.toString() || null,
      rejected_at: leaveRequest.rejectedAt || null,
      rejection_reason: leaveRequest.rejectionReason || null,
      comments: null, // Not implemented in current schema
      created_at: leaveRequest.createdAt,
      updated_at: leaveRequest.updatedAt,
      department: leaveRequest.department?.name,
      position: leaveRequest.designation?.name,
      total_leave_balance: 20, // Default leave balance - should be calculated from employee's leave policy
      leave_taken_this_year: 0, // Should be calculated from approved leaves this year
      attachments: [], // Not implemented in current schema
      approval_history: [
        {
          id: '1',
          action:
            leaveRequest.status === 'pending'
              ? 'Submitted'
              : leaveRequest.status === 'approved'
                ? 'Approved'
                : leaveRequest.status === 'rejected'
                  ? 'Rejected'
                  : 'Submitted',
          approver: leaveRequest.employee?.firstName + ' ' + leaveRequest.employee?.lastName,
          date: leaveRequest.createdAt,
          comments:
            leaveRequest.status === 'pending'
              ? 'Leave request submitted for approval'
              : leaveRequest.status === 'rejected'
                ? `Leave request rejected: ${leaveRequest.rejectionReason || 'No reason provided'}`
                : 'Leave request submitted for approval',
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: transformedLeaveRequest,
    });
  } catch (error) {
    
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
export const DELETE = withPermission(PermissionConfigs.leave.delete)(async (request: NextRequest) => {
  // Extract id from URL params
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 2]; // Get id from /api/leave-requests/[id]
  
  if (!id) {
    return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 });
  }
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if leave request exists
    const [existingLeaveRequest] = await db
      .select()
      .from(employeeLeaves)
      .where(eq(employeeLeaves.id, parseInt(id)))
      .limit(1);

    if (!existingLeaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Delete the leave request
    await db.delete(employeeLeaves).where(eq(employeeLeaves.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

// PUT /api/leave-requests/[id] - Update a leave request
export const PUT = withPermission(PermissionConfigs.leave.update)(async (request: NextRequest) => {
  try {
    // Extract id from URL params
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get id from /api/leave-requests/[id]
    
    if (!id) {
      return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 });
    }
    
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { leave_type, start_date, end_date, days, reason, status } = body;

    // Validate required fields
    if (!leave_type || !start_date || !end_date || !days || !reason || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate dates
    if (new Date(start_date) > new Date(end_date)) {
      return NextResponse.json({ error: 'Start date cannot be after end date' }, { status: 400 });
    }

    // Check if leave request exists
    const [existingLeave] = await db
      .select({
        id: employeeLeaves.id,
        employeeId: employeeLeaves.employeeId,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
        },
      })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employeeLeaves.employeeId, employees.id))
      .where(eq(employeeLeaves.id, parseInt(id)))
      .limit(1);

    if (!existingLeave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Update the leave request
    const [updatedLeave] = await db
      .update(employeeLeaves)
      .set({
        leaveType: leave_type,
        startDate: start_date,
        endDate: end_date,
        days: days,
        reason: reason,
        status: status,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(employeeLeaves.id, parseInt(id)))
      .returning({
        id: employeeLeaves.id,
        leaveType: employeeLeaves.leaveType,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate,
        days: employeeLeaves.days,
        reason: employeeLeaves.reason,
        status: employeeLeaves.status,
        createdAt: employeeLeaves.createdAt,
        updatedAt: employeeLeaves.updatedAt,
      });

    if (!updatedLeave) {
      return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedLeave.id.toString(),
        leave_type: updatedLeave.leaveType,
        start_date: updatedLeave.startDate.split('T')[0],
        end_date: updatedLeave.endDate.split('T')[0],
        days: updatedLeave.days,
        reason: updatedLeave.reason,
        status: updatedLeave.status,
        employee: {
          name: existingLeave.employee
            ? `${existingLeave.employee.firstName} ${existingLeave.employee.lastName}`
            : 'Unknown',
          employee_id: existingLeave.employee?.fileNumber || 'Unknown',
        },
        created_at: updatedLeave.createdAt,
        updated_at: updatedLeave.updatedAt,
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
