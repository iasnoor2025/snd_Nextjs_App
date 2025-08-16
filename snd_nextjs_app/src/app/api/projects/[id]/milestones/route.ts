import { NextRequest, NextResponse } from 'next/server';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _projectId } = await params;

    // TODO: Implement milestones when Milestone model is added to schema
    // For now, return empty array
    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('Error fetching project milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project milestones' },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _projectId } = await params;

    // TODO: Implement milestone creation when Milestone model is added to schema
    return NextResponse.json(
      { error: 'Milestones not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error creating project milestone:', error);
    return NextResponse.json(
      { error: 'Failed to create project milestone' },
      { status: 500 }
    );
  }
}
