import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectTasks, projects } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(completionPercentage !== undefined && { completionPercentage: completionPercentage ? parseFloat(completionPercentage) : 0 }),
        ...(estimatedHours !== undefined && { estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null }),
        ...(actualHours !== undefined && { actualHours: actualHours ? parseFloat(actualHours) : null }),
        ...(parentTaskId !== undefined && { parentTaskId: parentTaskId ? parseInt(parentTaskId) : null }),
        ...(order !== undefined && { order }),
        updatedAt: new Date(),
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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
}
