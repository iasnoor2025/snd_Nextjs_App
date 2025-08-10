import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { employeeAssignments, employees, users, projects } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// Helper function to get the appropriate permission for approval stage
function getAssignmentApprovalPermission(approvalStage: string): string {
  switch (approvalStage) {
    case 'manager':
      return 'approve.assignment.manager';
    case 'hr':
      return 'approve.assignment.hr';
    default:
      return 'approve.assignment';
  }
}

// POST /api/assignments/approve - Approve assignment at specific stage
export const POST = withPermission(
  async (request: NextRequest) => {
    try {
      const { assignmentId, approvalStage, notes } = await request.json();

      // Get the assignment using Drizzle
      const assignmentRows = await db
        .select({
          id: employeeAssignments.id,
          status: employeeAssignments.status,
          employeeId: employeeAssignments.employeeId,
          projectId: employeeAssignments.projectId,
          rentalId: employeeAssignments.rentalId,
          startDate: employeeAssignments.startDate,
          endDate: employeeAssignments.endDate,
          notes: employeeAssignments.notes,
          location: employeeAssignments.location,
          name: employeeAssignments.name,
          type: employeeAssignments.type,
          employee: {
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            } as any
          },
          project: {
            id: projects.id,
            name: projects.name,
            description: projects.description,
          }
        })
        .from(employeeAssignments)
        .leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
        .where(eq(employeeAssignments.id, assignmentId))
        .limit(1);

      if (assignmentRows.length === 0) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      const assignment = assignmentRows[0];

      // Validate approval stage
      const validStages = ['manager', 'hr'];
      if (!validStages.includes(approvalStage)) {
        return NextResponse.json({ error: 'Invalid approval stage' }, { status: 400 });
      }

      // Check if assignment can be approved at this stage
      let canApprove = false;
      let newStatus = '';

      switch (approvalStage) {
        case 'manager':
          canApprove = assignment.status === 'pending';
          newStatus = 'manager_approved';
          break;
        case 'hr':
          canApprove = assignment.status === 'manager_approved';
          newStatus = 'hr_approved';
          break;
      }

      if (!canApprove) {
        return NextResponse.json({
          error: `Assignment cannot be approved at ${approvalStage} stage. Current status: ${assignment.status}`
        }, { status: 400 });
      }

      // Update assignment with approval using Drizzle
      // Note: Since the current schema doesn't have approval workflow fields,
      // we'll just update the status and add notes
      const updateData: any = {
        status: newStatus,
        notes: notes ? `${assignment.notes || ''}\n[${approvalStage.toUpperCase()} APPROVED] ${notes}`.trim() : assignment.notes,
        updatedAt: new Date().toISOString()
      };

      const updatedAssignmentRows = await db
        .update(employeeAssignments)
        .set(updateData)
        .where(eq(employeeAssignments.id, assignmentId))
        .returning();

      const updatedAssignment = updatedAssignmentRows[0];

      // Get updated employee and project data for response
      const updatedAssignmentWithJoins = await db
        .select({
          id: employeeAssignments.id,
          status: employeeAssignments.status,
          employeeId: employeeAssignments.employeeId,
          projectId: employeeAssignments.projectId,
          rentalId: employeeAssignments.rentalId,
          startDate: employeeAssignments.startDate,
          endDate: employeeAssignments.endDate,
          notes: employeeAssignments.notes,
          location: employeeAssignments.location,
          name: employeeAssignments.name,
          type: employeeAssignments.type,
          employee: {
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            } as any
          },
          project: {
            id: projects.id,
            name: projects.name,
            description: projects.description,
          }
        })
        .from(employeeAssignments)
        .leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
        .where(eq(employeeAssignments.id, assignmentId))
        .limit(1);

      const finalAssignment = updatedAssignmentWithJoins[0];

      return NextResponse.json({
        message: `Assignment approved at ${approvalStage} stage`,
        assignment: finalAssignment
      });

    } catch (error) {
      console.error('Error approving assignment:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    action: 'approve',
    subject: 'Assignment'
  }
); 