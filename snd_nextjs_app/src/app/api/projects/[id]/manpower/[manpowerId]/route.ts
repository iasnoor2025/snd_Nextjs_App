import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectManpower, projects, employees, employeeAssignments } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { AssignmentService } from '@/lib/services/assignment-service';


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; manpowerId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, manpowerId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!manpowerId || isNaN(parseInt(manpowerId))) {
      return NextResponse.json({ error: 'Invalid manpower ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify manpower exists and belongs to the project
    const existingManpower = await db
      .select()
      .from(projectManpower)
      .where(
        and(
          eq(projectManpower.id, parseInt(manpowerId)),
          eq(projectManpower.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingManpower.length === 0) {
      return NextResponse.json({ error: 'Manpower resource not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      employeeId,
      jobTitle,
      dailyRate,
      startDate,
      endDate,
      totalDays,
      actualDays,
      status,
      notes,
    } = body;

    // Update manpower
    const [updatedManpower] = await db
      .update(projectManpower)
      .set({
        ...(employeeId !== undefined && { employeeId: employeeId ? parseInt(employeeId) : null }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(dailyRate !== undefined && { dailyRate: parseFloat(dailyRate).toString() }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : undefined }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null }),
        ...(totalDays !== undefined && { totalDays: totalDays ? parseInt(totalDays) : null }),
        ...(actualDays !== undefined && { actualDays: actualDays ? parseInt(actualDays) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }), 
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(projectManpower.id, parseInt(manpowerId)))
      .returning();

    // Auto-assign supervisor to employee if they are assigned to a project with a supervisor
    if (employeeId !== undefined && employeeId) {
      try {
        // Get project supervisor
        const projectWithSupervisor = await db
          .select({ supervisorId: projects.supervisorId })
          .from(projects)
          .where(eq(projects.id, parseInt(projectId)))
          .limit(1);

        if (projectWithSupervisor.length > 0 && projectWithSupervisor[0].supervisorId) {
          // Update employee's supervisor to match project supervisor
          await db
            .update(employees)
            .set({ 
              supervisor: projectWithSupervisor[0].supervisorId.toString(),
              updatedAt: new Date().toISOString().split('T')[0]
            })
            .where(eq(employees.id, parseInt(employeeId)));
        }
      } catch (supervisorError) {
        console.error('Error auto-assigning supervisor to employee:', supervisorError);
        // Don't fail the main operation if supervisor assignment fails
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedManpower,
      message: 'Manpower resource updated successfully'
    });
  } catch (error) {
    console.error('Error updating project manpower:', error);
    return NextResponse.json({ error: 'Failed to update project manpower' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; manpowerId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, manpowerId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!manpowerId || isNaN(parseInt(manpowerId))) {
      return NextResponse.json({ error: 'Invalid manpower ID' }, { status: 400 });
    }

    // Verify manpower exists and belongs to the project
    const existingManpower = await db
      .select({
        id: projectManpower.id,
        employeeId: projectManpower.employeeId,
        projectId: projectManpower.projectId,
        jobTitle: projectManpower.jobTitle,
      })
      .from(projectManpower)
      .where(
        and(
          eq(projectManpower.id, parseInt(manpowerId)),
          eq(projectManpower.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingManpower.length === 0) {
      return NextResponse.json({ error: 'Manpower resource not found' }, { status: 404 });
    }

    const manpower = existingManpower[0];

    // Delete the corresponding employee assignment if it exists
    // The assignment was auto-created when manpower was added, so we should delete it when manpower is deleted
    if (manpower.employeeId) {
      try {
        // Find the employee assignment that was created for this project and employee
        // The assignment was created with type: 'project' (the schema field is 'type', not 'assignmentType')
        // Check for both active and completed assignments to be safe
        let assignments = await db
          .select({
            id: employeeAssignments.id,
            employeeId: employeeAssignments.employeeId,
            projectId: employeeAssignments.projectId,
            type: employeeAssignments.type,
            status: employeeAssignments.status,
            notes: employeeAssignments.notes,
          })
          .from(employeeAssignments)
          .where(
            and(
              eq(employeeAssignments.employeeId, manpower.employeeId),
              eq(employeeAssignments.projectId, parseInt(projectId)),
              eq(employeeAssignments.type, 'project')
              // Don't filter by status - delete all matching assignments regardless of status
            )
          );

                // If no assignments found with exact match, try to find by notes pattern
        // The assignment notes format is: "Auto-created for project: {projectName} - {jobTitle}"
        if (assignments.length === 0) {
          // Get project name for notes matching
          const projectDetails = await db
            .select({ name: projects.name })
            .from(projects)
            .where(eq(projects.id, parseInt(projectId)))
            .limit(1);
          
          const projectName = projectDetails[0]?.name || '';
          
          // Try to find assignments by notes pattern
          const allAssignments = await db
            .select({
              id: employeeAssignments.id,
              employeeId: employeeAssignments.employeeId,
              projectId: employeeAssignments.projectId,
              type: employeeAssignments.type,
              status: employeeAssignments.status,
              notes: employeeAssignments.notes,
            })
            .from(employeeAssignments)
            .where(
              and(
                eq(employeeAssignments.employeeId, manpower.employeeId),
                eq(employeeAssignments.type, 'project')
              )
            );

          // Filter by notes pattern if project name is available
          const matchingAssignments = projectName && manpower.jobTitle
            ? allAssignments.filter(a => 
                a.notes?.includes(`Auto-created for project: ${projectName}`) ||
                a.notes?.includes(manpower.jobTitle || '')
              )
            : allAssignments.filter(a => a.projectId === parseInt(projectId));

          if (matchingAssignments.length > 0) {
                        assignments = [...assignments, ...matchingAssignments];
          }
        }

        // Delete all matching assignments (there should typically be only one)
        for (const assignment of assignments) {
          try {
            await AssignmentService.deleteAssignment(assignment.id, assignment.employeeId);
          } catch (assignmentError) {
            console.error(`❌ Error deleting employee assignment ${assignment.id}:`, assignmentError);
            // Continue with manpower deletion even if assignment deletion fails
          }
        }

        if (assignments.length === 0) {
        }
      } catch (error) {
        console.error('❌ Error finding/deleting employee assignments:', error);
        // Continue with manpower deletion even if assignment deletion fails
      }
    }

    // Delete manpower
    await db
      .delete(projectManpower)
      .where(eq(projectManpower.id, parseInt(manpowerId)));

    return NextResponse.json({
      success: true,
      message: 'Manpower resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project manpower:', error);
    return NextResponse.json({ error: 'Failed to delete project manpower' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; manpowerId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, manpowerId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!manpowerId || isNaN(parseInt(manpowerId))) {
      return NextResponse.json({ error: 'Invalid manpower ID' }, { status: 400 });
    }

    // Get manpower
    const manpower = await db
      .select()
      .from(projectManpower)
      .where(
        and(
          eq(projectManpower.id, parseInt(manpowerId)),
          eq(projectManpower.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (manpower.length === 0) {
      return NextResponse.json({ error: 'Manpower resource not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: manpower[0]
    });
  } catch (error) {
    console.error('Error fetching project manpower:', error);
    return NextResponse.json({ error: 'Failed to fetch project manpower' }, { status: 500 });
  }
}
