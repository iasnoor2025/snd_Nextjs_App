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
        orderBy: { created_at: 'desc' },
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
      priority: 'medium', // Default value since priority field doesn't exist
      start_date: project.start_date?.toISOString() || '',
      end_date: project.end_date?.toISOString() || '',
      budget: Number(project.budget) || 0,
      progress: 0, // Default value since progress field doesn't exist
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
      customer_id,
      location_id,
      manager_id,
      start_date,
      end_date,
      status,
      priority,
      budget,
      initial_budget,
      notes,
      objectives,
      scope,
      deliverables,
      constraints,
      assumptions,
      risks,
      quality_standards,
      communication_plan,
      stakeholder_management,
      change_management,
      procurement_plan,
      resource_plan,
      schedule_plan,
      cost_plan,
      quality_plan,
      risk_plan,
      communication_plan_detailed,
      stakeholder_plan,
      change_plan,
      procurement_plan_detailed,
      resource_plan_detailed,
      schedule_plan_detailed,
      cost_plan_detailed,
      quality_plan_detailed,
      risk_plan_detailed,
    } = body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        customer_id: customer_id ? parseInt(customer_id) : null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status: status || 'planning',
        budget: budget ? parseFloat(budget) : null,
        notes: notes || objectives || scope || deliverables || constraints || assumptions || risks || quality_standards || communication_plan || stakeholder_management || change_management || procurement_plan || resource_plan || schedule_plan || cost_plan || quality_plan || risk_plan || communication_plan_detailed || stakeholder_plan || change_plan || procurement_plan_detailed || resource_plan_detailed || schedule_plan_detailed || cost_plan_detailed || quality_plan_detailed || risk_plan_detailed,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully'
    }, { status: 201 });
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
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        budget: budget ? parseFloat(budget) : null,
        notes: body.notes,
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
