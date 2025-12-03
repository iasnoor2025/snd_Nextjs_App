import { db } from '@/lib/drizzle';
import { departments, designations, employeeLeaves, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// GET /api/leave-requests/[id]/public - Get a single leave request (no auth required)
export async function GET({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const leaveRequestData = await db
      .select({
        id: employeeLeaves.id,
        leaveType: employeeLeaves.leaveType,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate,
        days: employeeLeaves.days,
        reason: employeeLeaves.reason,
        status: employeeLeaves.status,
        createdAt: employeeLeaves.createdAt,
        updatedAt: employeeLeaves.updatedAt,
        approvedBy: employeeLeaves.approvedBy,
        approvedAt: employeeLeaves.approvedAt,
        rejectedBy: employeeLeaves.rejectedBy,
        rejectedAt: employeeLeaves.rejectedAt,
        rejectionReason: employeeLeaves.rejectionReason,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone,
          department: {
            name: departments.name,
          } as any,
          designation: {
            name: designations.name,
          } as any,
        },
      })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employeeLeaves.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employeeLeaves.id, parseInt(id)))
      .limit(1);

    const leaveRequest = leaveRequestData[0];
    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const transformedLeaveRequest = {
      id: leaveRequest.id.toString(),
      employee_name: leaveRequest.employee
        ? `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`
        : 'Unknown Employee',
      employee_id: leaveRequest.employee?.fileNumber || 'Unknown',
      leave_type: leaveRequest.leaveType,
      start_date: leaveRequest.startDate.split('T')[0],
      end_date: leaveRequest.endDate.split('T')[0],
      days_requested: leaveRequest.days,
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      submitted_date: leaveRequest.createdAt,
      approved_by: leaveRequest.approvedBy?.toString() || null,
      approved_date: leaveRequest.approvedAt || null,
      rejected_by: leaveRequest.rejectedBy?.toString() || null,
      rejected_at: leaveRequest.rejectedAt || null,
      rejection_reason: leaveRequest.rejectionReason || null,
      comments: null,
      created_at: leaveRequest.createdAt,
      updated_at: leaveRequest.updatedAt,
      department: leaveRequest.employee?.department?.name || 'Unknown',
      position: leaveRequest.employee?.designation?.name || 'Unknown',
      total_leave_balance: null,
      leave_taken_this_year: null,
      attachments: [],
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
          approver: leaveRequest.employee
            ? leaveRequest.employee.firstName + ' ' + leaveRequest.employee.lastName
            : 'Unknown Employee',
          date: leaveRequest.createdAt,
          comments:
            leaveRequest.status === 'pending'
              ? 'Leave request submitted for approval'
              : leaveRequest.status === 'approved'
                ? 'Leave request approved'
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
