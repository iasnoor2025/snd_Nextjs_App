import { db } from '@/lib/db';
import { withPermission } from '@/lib/rbac/api-middleware';
import { NextRequest, NextResponse } from 'next/server';

import { employeeAssignments, employees, projects, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// POST /api/assignments/approve - Approve assignment at specific stage
export const POST = withPermission(
  async (request: NextRequest) => {
    try {
      const { assignmentId, approvalStage } = await request.json();

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
            } as any,
          },
          project: {
            id: projects.id,
            name: projects.name,
            description: projects.description,
          },
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

      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      // Validate approval stage
      const validStages = ['manager', 'hr'];
      if (!validStages.includes(approvalStage)) {
        return NextResponse.json({ error: 'Invalid approval stage' }, { status: 400 });
      }

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
            } as any,
          },
          project: {
            id: projects.id,
            name: projects.name,
            description: projects.description,
          },
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
        assignment: finalAssignment,
      });
    } catch (error) {
      
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  {
    action: 'approve',
    subject: 'Assignment',
  }
);
