import { NextRequest, NextResponse } from 'next/server';
import { LeaveReportPDFService } from '@/lib/services/leave-report-pdf-service';
import { db } from '@/lib/drizzle';
import { employeeLeaves, employees, departments, designations } from '@/lib/drizzle/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const language = (searchParams.get('lang') || 'en') as 'en' | 'ar';

    if (!status || status === 'all') {
      return NextResponse.json({ error: 'Status parameter is required' }, { status: 400 });
    }

    // Fetch all leave requests with the specified status
    const leaveRequestsData = await db
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
      .where(eq(employeeLeaves.status, status))
      .orderBy(asc(employees.fileNumber));

    // Transform data for PDF service
    let leaves = leaveRequestsData.map(leave => ({
      id: leave.id.toString(),
      employee_name: `${leave.employee.firstName} ${leave.employee.lastName}`,
      employee_id: leave.employee.fileNumber || leave.employee.id.toString(),
      leave_type: leave.leaveType,
      start_date: leave.startDate,
      end_date: leave.endDate,
      days_requested: leave.days,
      reason: leave.reason || '',
      status: leave.status,
      submitted_date: leave.createdAt,
      approved_by: leave.approvedBy?.toString() || null,
      approved_date: leave.approvedAt || null,
      rejected_by: leave.rejectedBy?.toString() || null,
      rejected_at: leave.rejectedAt || null,
      rejection_reason: leave.rejectionReason || null,
      return_date: leave.returnDate || null,
      returned_by: leave.returnedBy?.toString() || null,
      return_reason: leave.returnReason || null,
      department: leave.department?.name || undefined,
      position: leave.designation?.name || undefined,
      created_at: leave.createdAt,
      updated_at: leave.updatedAt,
    }));

    // Sort by file number (as fallback, in case database sort doesn't work as expected)
    leaves.sort((a, b) => {
      const fileA = a.employee_id || '';
      const fileB = b.employee_id || '';
      // Try numeric comparison first, fallback to string comparison
      const numA = parseInt(fileA);
      const numB = parseInt(fileB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return fileA.localeCompare(fileB);
    });

    // Calculate totals
    const totalLeaves = leaves.length;
    const totalDays = leaves.reduce((sum, leave) => sum + leave.days_requested, 0);

    // Prepare report data
    const reportData = {
      status: status,
      leaves: leaves,
      totalLeaves: totalLeaves,
      totalDays: totalDays,
    };

    // Generate PDF
    const pdfBuffer = await LeaveReportPDFService.generateStatusReportPDF(reportData, language);

    // Generate filename
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const filename = `Leave_Report_${formattedStatus}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating status-based leave report PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

