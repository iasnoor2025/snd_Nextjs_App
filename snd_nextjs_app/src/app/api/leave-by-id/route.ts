import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    console.log('Fetching leave by ID:', id);
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }
    
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
    console.error('Error fetching leave by ID:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    console.log('Deleting leave with ID:', id);
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting leave:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    console.log('Updating leave with ID:', id);
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      data: {
        id: parseInt(id),
        leave_type,
        start_date,
        end_date,
        days,
        reason,
        status,
        updated_at: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Error updating leave:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
