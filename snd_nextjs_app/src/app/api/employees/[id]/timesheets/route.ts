import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Mock timesheet data
    const timesheets = [
      {
        id: 1,
        date: '2024-01-15',
        clock_in: '08:00',
        clock_out: '17:00',
        regular_hours: 8,
        overtime_hours: 1,
        status: 'approved'
      },
      {
        id: 2,
        date: '2024-01-16',
        clock_in: '08:30',
        clock_out: '17:30',
        regular_hours: 8,
        overtime_hours: 0.5,
        status: 'approved'
      },
      {
        id: 3,
        date: '2024-01-17',
        clock_in: '08:00',
        clock_out: '18:00',
        regular_hours: 8,
        overtime_hours: 2,
        status: 'pending'
      },
      {
        id: 4,
        date: '2024-01-18',
        clock_in: '08:15',
        clock_out: '17:15',
        regular_hours: 8,
        overtime_hours: 0,
        status: 'approved'
      },
      {
        id: 5,
        date: '2024-01-19',
        clock_in: '08:00',
        clock_out: '16:00',
        regular_hours: 7,
        overtime_hours: 0,
        status: 'approved'
      }
    ];

    return NextResponse.json({
      success: true,
      data: timesheets,
      message: 'Timesheets retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/timesheets:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch timesheets: ' + (error as Error).message
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
      message: 'Timesheet created successfully',
      data: { id: Math.floor(Math.random() * 1000), employee_id: parseInt(id), ...body }
    });
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/timesheets:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create timesheet: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
