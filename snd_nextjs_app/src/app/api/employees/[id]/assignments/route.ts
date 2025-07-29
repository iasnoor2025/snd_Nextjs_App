import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Mock assignment data
    const assignments = [
      {
        id: 1,
        name: 'Riyadh Project',
        location: 'Riyadh, Saudi Arabia',
        start_date: '2024-01-01',
        end_date: '2024-06-30',
        status: 'active',
        notes: 'Main project assignment for the first half of the year'
      },
      {
        id: 2,
        name: 'Jeddah Site',
        location: 'Jeddah, Saudi Arabia',
        start_date: '2024-02-15',
        end_date: '2024-03-15',
        status: 'completed',
        notes: 'Temporary assignment for site inspection'
      },
      {
        id: 3,
        name: 'Dammam Operations',
        location: 'Dammam, Saudi Arabia',
        start_date: '2024-07-01',
        end_date: null,
        status: 'active',
        notes: 'Ongoing operations support'
      },
      {
        id: 4,
        name: 'Training Program',
        location: 'Riyadh Office',
        start_date: '2024-04-01',
        end_date: '2024-04-30',
        status: 'completed',
        notes: 'Professional development training'
      }
    ];

    return NextResponse.json({
      success: true,
      data: assignments,
      message: 'Assignments retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch assignments: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Mock create response
    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      data: { id: Math.floor(Math.random() * 1000), employee_id: parseInt(id), ...body }
    });
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create assignment: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}


