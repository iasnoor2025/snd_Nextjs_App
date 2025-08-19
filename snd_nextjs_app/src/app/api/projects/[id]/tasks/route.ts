import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectTasks, projects, employees } from '@/lib/drizzle/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');
    const priority = searchParams.get('priority');

    // Build where conditions
    let whereConditions = [eq(projectTasks.projectId, parseInt(projectId))];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(projectTasks.status, status));
    }
    
    if (assignedTo && assignedTo !== 'all') {
      whereConditions.push(eq(projectTasks.assignedToId, parseInt(assignedTo)));
    }
    
    if (priority && priority !== 'all') {
      whereConditions.push(eq(projectTasks.priority, priority));
    }

    // Fetch tasks with related data
    const tasks = await db
      .select({
        id: projectTasks.id,
        name: projectTasks.name,
        description: projectTasks.description,
        status: projectTasks.status,
        priority: projectTasks.priority,
        assignedToId: projectTasks.assignedToId,
        startDate: projectTasks.startDate,
        dueDate: projectTasks.dueDate,
        completionPercentage: projectTasks.completionPercentage,
        estimatedHours: projectTasks.estimatedHours,
        actualHours: projectTasks.actualHours,
        parentTaskId: projectTasks.parentTaskId,
        order: projectTasks.order,
        createdAt: projectTasks.createdAt,
        updatedAt: projectTasks.updatedAt,
        assignedToName: employees.firstName,
        assignedToLastName: employees.lastName,
      })
      .from(projectTasks)
      .leftJoin(employees, eq(projectTasks.assignedToId, employees.id))
      .where(and(...whereConditions))
      .orderBy(asc(projectTasks.order), desc(projectTasks.createdAt));

    return NextResponse.json({ 
      success: true,
      data: tasks 
    });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch project tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
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

    const body = await request.json();
    const {
      name,
      description,
      status = 'pending',
      priority = 'medium',
      assignedToId,
      startDate,
      dueDate,
      estimatedHours,
      parentTaskId,
      order = 0,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }

    // Create task
    const [newTask] = await db
      .insert(projectTasks)
      .values({
        projectId: parseInt(projectId),
        name,
        description,
        status,
        priority,
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        parentTaskId: parentTaskId ? parseInt(parentTaskId) : null,
        order,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      data: newTask,
      message: 'Task created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project task:', error);
    return NextResponse.json({ error: 'Failed to create project task' }, { status: 500 });
  }
}
