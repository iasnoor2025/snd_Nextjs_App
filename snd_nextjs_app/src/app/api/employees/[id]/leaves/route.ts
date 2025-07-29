import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Mock leave data
    const leaves = [
      {
        id: 1,
        leave_type: 'Annual Leave',
        start_date: '2024-02-15',
        end_date: '2024-02-20',
        reason: 'Family vacation',
        status: 'approved',
        return_date: '2024-02-21'
      },
      {
        id: 2,
        leave_type: 'Sick Leave',
        start_date: '2024-01-10',
        end_date: '2024-01-12',
        reason: 'Medical appointment',
        status: 'approved',
        return_date: '2024-01-13'
      },
      {
        id: 3,
        leave_type: 'Emergency Leave',
        start_date: '2024-03-05',
        end_date: '2024-03-07',
        reason: 'Family emergency',
        status: 'pending'
      },
      {
        id: 4,
        leave_type: 'Annual Leave',
        start_date: '2024-04-20',
        end_date: '2024-04-25',
        reason: 'Personal time off',
        status: 'approved',
        return_date: '2024-04-26'
      }
    ];

    return NextResponse.json({
      success: true,
      data: leaves,
      message: 'Leave requests retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave requests: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Mock create response
    return NextResponse.json({
      success: true,
      message: 'Leave request created successfully',
      data: { id: Math.floor(Math.random() * 1000), employee_id: parseInt(id), ...body }
    });
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create leave request: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
