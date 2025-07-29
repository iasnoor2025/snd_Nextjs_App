import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          rentals: {
            include: {
              customer: true
            }
          }
        }
      }),
      prisma.project.count({ where }),
    ]);

    // Transform the data to match the frontend expectations
    const transformedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      client: project.rentals[0]?.customer?.name || 'Unknown Client',
      status: project.status,
      priority: project.priority || 'medium',
      start_date: project.startDate?.toISOString() || '',
      end_date: project.endDate?.toISOString() || '',
      budget: Number(project.budget) || 0,
      progress: Number(project.progress) || 0,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: transformedProjects,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/projects?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/projects?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      status,
      priority,
      start_date,
      end_date,
      budget,
      progress,
      manager_id,
    } = body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        priority,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        budget: budget ? parseFloat(budget) : null,
        progress: progress ? parseFloat(progress) : null,
        managerId: manager_id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      status,
      priority,
      start_date,
      end_date,
      budget,
      progress,
      manager_id,
    } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        status,
        priority,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        budget: budget ? parseFloat(budget) : null,
        progress: progress ? parseFloat(progress) : null,
        managerId: manager_id,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    await prisma.project.delete({
      where: { id },
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
