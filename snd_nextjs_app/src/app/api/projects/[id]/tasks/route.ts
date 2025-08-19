import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // TODO: Implement project tasks when ProjectTask model is added to schema
    // For now, return empty array
    return NextResponse.json({ data: [] });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to fetch project tasks' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // TODO: Implement project task creation when ProjectTask model is added to schema
    return NextResponse.json({ error: 'Project tasks not implemented yet' }, { status: 501 });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to create project task' }, { status: 500 });
  }
}
