import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // TODO: Implement project tasks when ProjectTask model is added to schema
    // For now, return empty array
    return NextResponse.json({ data: [] });
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

    // TODO: Implement project task creation when ProjectTask model is added to schema
    return NextResponse.json(
      { error: 'Project tasks not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error creating project task:', error);
    return NextResponse.json(
      { error: 'Failed to create project task' },
      { status: 500 }
    );
  }
}
