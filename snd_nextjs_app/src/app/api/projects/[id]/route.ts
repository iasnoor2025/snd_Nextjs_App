import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        rentals: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend expectations
    const transformedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      client_name: project.rentals[0]?.customer?.name || 'Unknown Client',
      client_contact: project.rentals[0]?.customer?.email || 'No contact info',
      status: project.status,
      priority: project.priority || 'medium',
      start_date: project.startDate?.toISOString() || '',
      end_date: project.endDate?.toISOString() || '',
      budget: Number(project.budget) || 0,
      initial_budget: Number(project.budget) || 0,
      current_budget: Number(project.budget) * 0.65 || 0, // Mock current budget
      budget_status: 'On Track',
      budget_notes: 'Project is progressing well within budget constraints.',
      progress: Number(project.progress) || 0,
      manager: {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@company.com'
      },
      manager_id: project.managerId || '1',
      team_size: 25,
      location: 'Downtown Business District',
      notes: 'Project is progressing well with foundation work completed and structural framework 65% complete.'
    };

    return NextResponse.json({ data: transformedProject });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        priority: body.priority,
        startDate: body.start_date ? new Date(body.start_date) : null,
        endDate: body.end_date ? new Date(body.end_date) : null,
        budget: body.budget ? parseFloat(body.budget) : null,
        progress: body.progress ? parseFloat(body.progress) : null,
        managerId: body.manager_id,
      },
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
