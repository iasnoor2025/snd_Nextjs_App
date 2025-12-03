import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    console.log('Fetching leave by ID:', id);
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }
    
    // Import database and schema
    const { db } = await import('@/lib/drizzle');
    const { employeeLeaves, employees, departments, designations } = await import('@/lib/drizzle/schema');
    const { eq } = await import('drizzle-orm');

    // Fetch leave request with employee details
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
        returnDate: employeeLeaves.returnDate,
        returnedBy: employeeLeaves.returnedBy,
        returnReason: employeeLeaves.returnReason,
        employee: {
          id: employees.id,
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

    // Transform the data to match the expected format
    const transformedLeaveRequest = {
      id: leaveRequest.id.toString(),
      employee_name: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
      employee_id: leaveRequest.employee.id,
      leave_type: leaveRequest.leaveType,
      start_date: leaveRequest.startDate,
      end_date: leaveRequest.endDate,
      days_requested: leaveRequest.days,
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      submitted_date: leaveRequest.createdAt,
      approved_by: leaveRequest.approvedBy,
      approved_date: leaveRequest.approvedAt,
      rejected_by: leaveRequest.rejectedBy,
      rejected_at: leaveRequest.rejectedAt,
      rejection_reason: leaveRequest.rejectionReason,
      return_date: leaveRequest.returnDate,
      returned_by: leaveRequest.returnedBy,
      return_reason: leaveRequest.returnReason,
      comments: null,
      created_at: leaveRequest.createdAt,
      updated_at: leaveRequest.updatedAt,
      department: leaveRequest.employee.department?.name || 'N/A',
      position: leaveRequest.employee.designation?.name || 'N/A',
      total_leave_balance: 20, // This would need to be calculated
      leave_taken_this_year: 0, // This would need to be calculated
      attachments: [],
      approval_history: [
        {
          id: '1',
          action: 'Submitted',
          approver: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
          date: leaveRequest.createdAt,
          comments: 'Leave request submitted for approval',
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: transformedLeaveRequest,
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

    // Import database and schema
    const { db } = await import('@/lib/drizzle');
    const { employeeLeaves } = await import('@/lib/drizzle/schema');
    const { eq } = await import('drizzle-orm');

    // Check if leave request exists
    const existingLeave = await db
      .select({ id: employeeLeaves.id })
      .from(employeeLeaves)
      .where(eq(employeeLeaves.id, parseInt(id)))
      .limit(1);

    if (existingLeave.length === 0) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Delete the leave request
    await db.delete(employeeLeaves).where(eq(employeeLeaves.id, parseInt(id)));
    
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
