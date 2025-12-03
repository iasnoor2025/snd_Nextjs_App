import { NextResponse } from 'next/server';

export async function GET({ params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // Return mock data
    const mockLeaveRequest = {
      id: parseInt(id),
      employee_name: 'John Doe',
      employee_id: 5,
      leave_type: 'Sick Leave',
      start_date: '2025-09-04',
      end_date: '2025-09-04',
      days_requested: 1,
      reason: 'Not feeling well',
      status: 'pending',
      submitted_date: '2025-09-04',
      approved_by: null,
      approved_date: null,
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
      comments: null,
      created_at: '2025-09-04',
      updated_at: '2025-09-04',
      department: 'IT',
      position: 'Developer',
      total_leave_balance: 20,
      leave_taken_this_year: 0,
      attachments: [],
      approval_history: [
        {
          id: '1',
          action: 'Submitted',
          approver: 'John Doe',
          date: '2025-09-04',
          comments: 'Leave request submitted for approval',
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: mockLeaveRequest,
    });
  } catch (error) {
    console.error('Error fetching leave details:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
