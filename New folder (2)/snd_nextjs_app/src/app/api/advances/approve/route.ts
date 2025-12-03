import { db } from '@/lib/db';
import { withPermission } from '@/lib/rbac/api-middleware';
import { NextRequest, NextResponse } from 'next/server';

import { advancePayments, employees, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// POST /api/advances/approve - Approve advance at specific stage
export const POST = withPermission({
  action: 'approve',
  subject: 'Advance',
})(
  async (request: NextRequest) => {
    try {
      const { advanceId, approvalStage, notes } = await request.json();

      // Get the advance using Drizzle
      const advanceRows = await db
        .select({
          id: advancePayments.id,
          status: advancePayments.status,
          employeeId: advancePayments.employeeId,
          employee: {
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            } as any,
          },
        })
        .from(advancePayments)
        .leftJoin(employees, eq(advancePayments.employeeId, employees.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .where(eq(advancePayments.id, advanceId))
        .limit(1);

      if (advanceRows.length === 0) {
        return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
      }

      const advance = advanceRows[0];

      if (!advance) {
        return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
      }

      // Validate approval stage
      const validStages = ['manager', 'hr', 'finance'];
      if (!validStages.includes(approvalStage)) {
        return NextResponse.json({ error: 'Invalid approval stage' }, { status: 400 });
      }

      // Check if advance can be approved at this stage
      let canApprove = false;
      let newStatus = '';

      switch (approvalStage) {
        case 'manager':
          canApprove = advance.status === 'pending';
          newStatus = 'manager_approved';
          break;
        case 'hr':
          canApprove = advance.status === 'manager_approved';
          newStatus = 'hr_approved';
          break;
        case 'finance':
          canApprove = advance.status === 'hr_approved';
          newStatus = 'finance_approved';
          break;
      }

      if (!canApprove) {
        return NextResponse.json(
          {
            error: `Advance cannot be approved at ${approvalStage} stage. Current status: ${advance.status}`,
          },
          { status: 400 }
        );
      }

      // Update advance with approval using Drizzle
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      switch (approvalStage) {
        case 'manager':
          updateData.managerApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.managerApprovalAt = new Date().toISOString();
          updateData.managerApprovalNotes = notes;
          break;
        case 'hr':
          updateData.hrApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.hrApprovalAt = new Date().toISOString();
          updateData.hrApprovalNotes = notes;
          break;
        case 'finance':
          updateData.financeApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.financeApprovalAt = new Date().toISOString();
          updateData.financeApprovalNotes = notes;
          break;
      }

      const updatedAdvanceRows = await db
        .update(advancePayments)
        .set(updateData)
        .where(eq(advancePayments.id, advanceId))
        .returning();

      const updatedAdvance = updatedAdvanceRows[0];

      if (!updatedAdvance) {
        return NextResponse.json({ error: 'Failed to update advance' }, { status: 500 });
      }

      // Get updated employee data for response
      const employeeRows = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(employees)
        .leftJoin(users, eq(employees.userId, users.id))
        .where(eq(employees.id, updatedAdvance.employeeId))
        .limit(1);

      const employee = employeeRows[0];

      const advanceWithEmployee = {
        id: updatedAdvance.id,
        status: updatedAdvance.status,
        employee_id: updatedAdvance.employeeId,
        managerApprovalBy: updatedAdvance.managerApprovalBy,
        managerApprovalAt: updatedAdvance.managerApprovalAt,
        managerApprovalNotes: updatedAdvance.managerApprovalNotes,
        hrApprovalBy: updatedAdvance.hrApprovalBy,
        hrApprovalAt: updatedAdvance.hrApprovalAt,
        hrApprovalNotes: updatedAdvance.hrApprovalNotes,
        financeApprovalBy: updatedAdvance.financeApprovalBy,
        financeApprovalAt: updatedAdvance.financeApprovalAt,
        financeApprovalNotes: updatedAdvance.financeApprovalNotes,
        employee: employee
          ? {
              id: employee.id,
              first_name: employee.firstName,
              last_name: employee.lastName,
              user: employee.user,
            }
          : null,
      };

      return NextResponse.json({
        message: `Advance approved at ${approvalStage} stage`,
        advance: advanceWithEmployee,
      });
    } catch (error) {
      
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
