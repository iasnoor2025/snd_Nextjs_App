import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const tasks = await prisma.projectTask.findMany({
      where: { projectId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to match the frontend expectations
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      name: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assignedTo?.name || 'Unassigned',
      due_date: task.dueDate?.toISOString() || '',
      progress: task.completionPercentage
    }));

    return NextResponse.json({ data: transformedTasks });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project tasks' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const task = await prisma.projectTask.create({
      data: {
        projectId,
        title: body.name,
        description: body.description,
        status: body.status || 'pending',
        priority: body.priority || 'medium',
        dueDate: body.due_date ? new Date(body.due_date) : null,
        completionPercentage: body.progress || 0,
        assignedToId: body.assigned_to_id
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error('Error creating project task:', error);
    return NextResponse.json(
      { error: 'Failed to create project task' },
      { status: 500 }
    );
  }
}
