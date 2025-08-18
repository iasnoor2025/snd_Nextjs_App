import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { updateEmployeeStatusBasedOnLeave } from '@/lib/utils/employee-status';
import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withPermission(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const resolvedParams = await params;

      if (!resolvedParams || !resolvedParams.id) {
        console.error('Invalid params received:', resolvedParams);
        return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
      }

      const { id } = resolvedParams;

      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { success: false, message: 'Invalid employee ID' },
          { status: 400 }
        );
      }

      const employeeId = parseInt(id);

      const employeeCheck = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (employeeCheck.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Employee not found' },
          { status: 404 }
        );
      }

      await updateEmployeeStatusBasedOnLeave(employeeId);

      const leaves = await db
        .select({
          id: employeeLeaves.id,
          leave_type: employeeLeaves.leaveType,
          start_date: employeeLeaves.startDate,
          end_date: employeeLeaves.endDate,
          days: employeeLeaves.days,
          reason: employeeLeaves.reason,
          status: employeeLeaves.status,
          approved_by: employeeLeaves.approvedBy,
          approved_at: employeeLeaves.approvedAt,
          rejected_by: employeeLeaves.rejectedBy,
          rejected_at: employeeLeaves.rejectedAt,
          rejection_reason: employeeLeaves.rejectionReason,
          created_at: employeeLeaves.createdAt,
          updated_at: employeeLeaves.updatedAt,
          employee_id: employeeLeaves.employeeId,
          employee_first_name: employees.firstName,
          employee_last_name: employees.lastName,
          employee_file_number: employees.fileNumber,
        })
        .from(employeeLeaves)
        .leftJoin(employees, eq(employees.id, employeeLeaves.employeeId))
        .where(eq(employeeLeaves.employeeId, employeeId))
        .orderBy(desc(employeeLeaves.createdAt));

      if (leaves.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No leave requests found for this employee',
        });
      }

      const transformedLeaves = leaves.map(leave => ({
        id: leave.id,
        leave_type: leave.leave_type || '',
        start_date: leave.start_date
          ? typeof leave.start_date === 'string'
            ? leave.start_date.split('T')[0]
            : new Date(leave.start_date).toISOString().split('T')[0]
          : null,
        end_date: leave.end_date
          ? typeof leave.end_date === 'string'
            ? leave.end_date.split('T')[0]
            : new Date(leave.end_date).toISOString().split('T')[0]
          : null,
        days: leave.days || 0,
        reason: leave.reason || '',
        status: leave.status || 'pending',
        approved_by: leave.approved_by || null,
        approved_at: leave.approved_at
          ? typeof leave.approved_at === 'string'
            ? leave.approved_at
            : new Date(leave.approved_at).toISOString()
          : null,
        rejected_by: leave.rejected_by || null,
        rejected_at: leave.rejected_at
          ? typeof leave.rejected_at === 'string'
            ? leave.rejected_at
            : new Date(leave.rejected_at).toISOString()
          : null,
        rejection_reason: leave.rejection_reason || null,
        created_at: leave.created_at
          ? typeof leave.created_at === 'string'
            ? leave.created_at
            : new Date(leave.created_at).toISOString()
          : null,
        updated_at: leave.updated_at
          ? typeof leave.updated_at === 'string'
            ? leave.updated_at
            : new Date(leave.updated_at).toISOString()
          : null,
        employee: {
          first_name: leave.employee_first_name || '',
          last_name: leave.employee_last_name || '',
          employee_id: leave.employee_file_number || null,
        },
      }));

      return NextResponse.json({
        success: true,
        data: transformedLeaves,
        message: 'Leave requests retrieved successfully',
      });
    } catch (error) {
      console.error('Error in GET /api/employees/[id]/leaves:', error);

      let errorMessage = 'Failed to fetch leave requests';
      if (error instanceof Error) {
        errorMessage += ': ' + error.message;
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: process.env.NODE_ENV === 'development' ? error : undefined,
        },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.leave.read
);

export const POST = withPermission(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const resolvedParams = await params;

      if (!resolvedParams || !resolvedParams.id) {
        console.error('Invalid params received:', resolvedParams);
        return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
      }

      const { id } = resolvedParams;

      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { success: false, message: 'Invalid employee ID' },
          { status: 400 }
        );
      }

      const body = await request.json();

      if (!body.leave_type || !body.start_date || !body.end_date) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields: leave_type, start_date, end_date' },
          { status: 400 }
        );
      }

      const [newLeave] = await db
        .insert(employeeLeaves)
        .values({
          employeeId: parseInt(id),
          leaveType: body.leave_type,
          startDate: body.start_date,
          endDate: body.end_date,
          days: body.days || 0,
          reason: body.reason || '',
          status: body.status || 'pending',
          updatedAt: new Date().toISOString(),
        })
        .returning();

      await updateEmployeeStatusBasedOnLeave(parseInt(id));

      return NextResponse.json({
        success: true,
        message: 'Leave request created successfully',
        data: newLeave,
      });
    } catch (error) {
      console.error('Error in POST /api/employees/[id]/leaves:', error);

      let errorMessage = 'Failed to create leave request';
      if (error instanceof Error) {
        errorMessage += ': ' + error.message;
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: process.env.NODE_ENV === 'development' ? error : undefined,
        },
        { status: 500 }
      );
    }
  },
  PermissionConfigs.leave.create
);
