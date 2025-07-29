import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' }
    });

    // Transform the data to match the frontend expectations
    const transformedMilestones = milestones.map(milestone => ({
      id: milestone.id,
      name: milestone.name,
      description: milestone.description || '',
      due_date: milestone.dueDate.toISOString(),
      status: milestone.status,
      completed_date: milestone.completedAt?.toISOString() || null
    }));

    return NextResponse.json({ data: transformedMilestones });
  } catch (error) {
    console.error('Error fetching project milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project milestones' },
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

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        name: body.name,
        description: body.description,
        dueDate: new Date(body.due_date),
        status: body.status || 'pending'
      }
    });

    return NextResponse.json({ data: milestone }, { status: 201 });
  } catch (error) {
    console.error('Error creating project milestone:', error);
    return NextResponse.json(
      { error: 'Failed to create project milestone' },
      { status: 500 }
    );
  }
}
