import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // TODO: Implement project resources when ProjectResource model is added to schema
    // For now, return empty array
    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('Error fetching project resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project resources' },
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

    // TODO: Implement project resource creation when ProjectResource model is added to schema
    return NextResponse.json(
      { error: 'Project resources not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error creating project resource:', error);
    return NextResponse.json(
      { error: 'Failed to create project resource' },
      { status: 500 }
    );
  }
}
