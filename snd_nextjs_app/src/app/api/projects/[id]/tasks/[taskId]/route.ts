import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectTasks, projects } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const updateProjectTaskHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, taskId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!taskId || isNaN(parseInt(taskId))) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
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

    // Verify task exists and belongs to the project
    const existingTask = await db
      .select()
      .from(projectTasks)
      .where(
        and(
          eq(projectTasks.id, parseInt(taskId)),
          eq(projectTasks.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      status,
      priority,
      assignedToId,
      startDate,
      dueDate,
      completionPercentage,
      estimatedHours,
      actualHours,
      parentTaskId,
      order,
    } = body;

    // Update task
    const [updatedTask] = await db
      .update(projectTasks)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId ? parseInt(assignedToId) : null }),
        // Store dates as YYYY-MM-DD strings to avoid timezone issues
        ...(startDate !== undefined && { startDate: startDate ? startDate.split('T')[0] : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? dueDate.split('T')[0] : null }),
        ...(completionPercentage !== undefined && { completionPercentage: completionPercentage ? parseFloat(completionPercentage) : 0 }),
        ...(estimatedHours !== undefined && { estimatedHours: estimatedHours ? parseFloat(estimatedHours).toString() : null }),
        ...(actualHours !== undefined && { actualHours: actualHours ? parseFloat(actualHours).toString() : null }),
        ...(parentTaskId !== undefined && { parentTaskId: parentTaskId ? parseInt(parentTaskId) : null }),
        ...(order !== undefined && { order }),
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(projectTasks.id, parseInt(taskId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating project task:', error);
    return NextResponse.json({ error: 'Failed to update project task' }, { status: 500 });
  }
};

const deleteProjectTaskHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, taskId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!taskId || isNaN(parseInt(taskId))) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Verify task exists and belongs to the project
    const existingTask = await db
      .select()
      .from(projectTasks)
      .where(
        and(
          eq(projectTasks.id, parseInt(taskId)),
          eq(projectTasks.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete task
    await db
      .delete(projectTasks)
      .where(eq(projectTasks.id, parseInt(taskId)));

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project task:', error);
    return NextResponse.json({ error: 'Failed to delete project task' }, { status: 500 });
  }
}

const getProjectTaskHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, taskId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!taskId || isNaN(parseInt(taskId))) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Get task
    const task = await db
      .select()
      .from(projectTasks)
      .where(
        and(
          eq(projectTasks.id, parseInt(taskId)),
          eq(projectTasks.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: task[0]
    });
  } catch (error) {
    console.error('Error fetching project task:', error);
    return NextResponse.json({ error: 'Failed to fetch project task' }, { status: 500 });
  }
};

export const GET = withPermission(PermissionConfigs.project.read)(getProjectTaskHandler);
export const PUT = withPermission(PermissionConfigs.project.update)(updateProjectTaskHandler);
export const DELETE = withPermission(PermissionConfigs.project.delete)(deleteProjectTaskHandler);
