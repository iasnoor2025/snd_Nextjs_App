import { NextRequest, NextResponse } from 'next/server';
import { LeaveReportPDFService } from '@/lib/services/leave-report-pdf-service';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees, departments, designations } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveId = parseInt(id);

    if (!leaveId || isNaN(leaveId)) {
      return NextResponse.json({ error: 'Invalid leave request ID' }, { status: 400 });
    }

    // Get language from query params or default to 'en'
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('lang') || 'en') as 'en' | 'ar';

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
        },
        department: {
          name: departments.name,
        } as any,
        designation: {
          name: designations.name,
        } as any,
      })
      .from(employeeLeaves)
      .leftJoin(employees, eq(employeeLeaves.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employeeLeaves.id, leaveId))
      .limit(1);

    const leaveRequest = leaveRequestData[0];

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Calculate leave balance (simplified - you may want to implement proper calculation)
    // This is a placeholder - implement actual leave balance calculation
    const totalLeaveBalance = 20; // Should be calculated from employee leave balance
    const leaveTakenThisYear = 0; // Should be calculated from employee leaves this year

    // Transform data for PDF service
    const pdfData = {
      id: leaveRequest.id.toString(),
      employee_name: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
      employee_id: leaveRequest.employee.fileNumber || leaveRequest.employee.id.toString(),
      leave_type: leaveRequest.leaveType,
      start_date: leaveRequest.startDate,
      end_date: leaveRequest.endDate,
      days_requested: leaveRequest.days,
      reason: leaveRequest.reason || '',
      status: leaveRequest.status,
      submitted_date: leaveRequest.createdAt,
      approved_by: leaveRequest.approvedBy?.toString() || null,
      approved_date: leaveRequest.approvedAt || null,
      rejected_by: leaveRequest.rejectedBy?.toString() || null,
      rejected_at: leaveRequest.rejectedAt || null,
      rejection_reason: leaveRequest.rejectionReason || null,
      return_date: leaveRequest.returnDate || null,
      returned_by: leaveRequest.returnedBy?.toString() || null,
      return_reason: leaveRequest.returnReason || null,
      department: leaveRequest.department?.name || undefined,
      position: leaveRequest.designation?.name || undefined,
      total_leave_balance: totalLeaveBalance,
      leave_taken_this_year: leaveTakenThisYear,
      created_at: leaveRequest.createdAt,
      updated_at: leaveRequest.updatedAt,
    };

    // Generate PDF
    const pdfBuffer = await LeaveReportPDFService.generateLeaveReportPDF(pdfData, language);

    // Generate filename
    const filename = `Leave_Report_${leaveRequest.id}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating leave report PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

