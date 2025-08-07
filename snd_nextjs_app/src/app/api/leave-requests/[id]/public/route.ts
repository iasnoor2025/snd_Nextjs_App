import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/leave-requests/[id]/public - Get a single leave request (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🔍 Fetching public leave request with ID:', id);

    const leaveRequest = await prisma.employeeLeave.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_id: true,
            email: true,
            phone: true,
            department: {
              select: {
                name: true,
              },
            },
            designation: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    const transformedLeaveRequest = {
      id: leaveRequest.id.toString(),
      employee_name: `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`,
      employee_id: leaveRequest.employee.employee_id,
      leave_type: leaveRequest.leave_type,
      start_date: leaveRequest.start_date.toISOString().split('T')[0],
      end_date: leaveRequest.end_date.toISOString().split('T')[0],
      days_requested: leaveRequest.days,
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      submitted_date: leaveRequest.created_at.toISOString(),
      approved_by: leaveRequest.approved_by?.toString() || null,
      approved_date: leaveRequest.approved_at?.toISOString() || null,
      rejected_by: leaveRequest.rejected_by?.toString() || null,
      rejected_at: leaveRequest.rejected_at?.toISOString() || null,
      rejection_reason: leaveRequest.rejection_reason || null,
      comments: null,
      created_at: leaveRequest.created_at.toISOString(),
      updated_at: leaveRequest.updated_at.toISOString(),
      department: leaveRequest.employee.department?.name,
      position: leaveRequest.employee.designation?.name,
      total_leave_balance: null,
      leave_taken_this_year: null,
      attachments: [],
      approval_history: [
        {
          id: "1",
          action: leaveRequest.status === 'pending' ? 'Submitted' : 
                  leaveRequest.status === 'approved' ? 'Approved' : 
                  leaveRequest.status === 'rejected' ? 'Rejected' : 'Submitted',
          approver: leaveRequest.employee.first_name + ' ' + leaveRequest.employee.last_name,
          date: leaveRequest.created_at.toISOString(),
          comments: leaveRequest.status === 'pending' ? 'Leave request submitted for approval' :
                   leaveRequest.status === 'approved' ? 'Leave request approved' :
                   leaveRequest.status === 'rejected' ? `Leave request rejected: ${leaveRequest.rejection_reason || 'No reason provided'}` :
                   'Leave request submitted for approval'
        }
      ]
    };

    console.log('✅ Returning public leave request data');
    return NextResponse.json({
      success: true,
      data: transformedLeaveRequest,
    });

  } catch (error) {
    console.error('❌ Error fetching public leave request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
