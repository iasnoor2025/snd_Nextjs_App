import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

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
