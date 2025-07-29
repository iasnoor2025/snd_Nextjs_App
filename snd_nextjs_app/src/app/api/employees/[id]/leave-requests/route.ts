import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;

    // For now, return empty data since we're not connected to Laravel backend
    // In the future, this would fetch from Laravel API
    const leaveRequests = {
      data: []
    };

    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave requests'
      },
      { status: 500 }
    );
  }
}
