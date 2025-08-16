import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects as projectsTable } from '@/lib/drizzle/schema';
import { and, or, ilike, eq, desc } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
export const GET = withPermission(
  async (request: NextRequest) => {
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

    const filters: any[] = [];
    if (search) {
      filters.push(or(ilike(projectsTable.name, `%${search}%`), ilike(projectsTable.description, `%${search}%`)));
    }
    if (status && status !== 'all') {
      filters.push(eq(projectsTable.status, status));
    }
    const whereExpr = filters.length ? and(...filters) : undefined;

    const rows = await db
      .select({
        id: projectsTable.id,
        name: projectsTable.name,
        description: projectsTable.description,
        status: projectsTable.status,
        budget: projectsTable.budget,
        start_date: projectsTable.startDate,
        end_date: projectsTable.endDate,
      })
      .from(projectsTable)
      .where(whereExpr as any)
      .orderBy(desc(projectsTable.createdAt))
      .offset(skip)
      .limit(limit);
    const countRows = await db.select({ id: projectsTable.id }).from(projectsTable).where(whereExpr as any);
    const total = countRows.length;

    // Transform the data to match the frontend expectations
    const transformedProjects = rows.map(project => ({
      id: project.id,
      name: project.name,
      client: 'Unknown Client',
      status: project.status,
      priority: 'medium',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: Number(project.budget) || 0,
      progress: 0,
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
  },
  PermissionConfigs.project.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      name,
      description,
      customer_id,
      start_date,
      end_date,
      status,
      budget,
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

    const inserted = await db
      .insert(projectsTable)
      .values({
        name,
        description: description ?? null,
        customerId: customer_id ? parseInt(customer_id) : null,
        startDate: start_date ? new Date(start_date).toISOString() : null,
        endDate: end_date ? new Date(end_date).toISOString() : null,
        status: status || 'planning',
        budget: budget ? String(parseFloat(budget)) : null,
        notes:
          (notes || objectives || scope || deliverables || constraints || assumptions || risks || quality_standards || communication_plan || stakeholder_management || change_management || procurement_plan || resource_plan || schedule_plan || cost_plan || quality_plan || risk_plan || communication_plan_detailed || stakeholder_plan || change_plan || procurement_plan_detailed || resource_plan_detailed || schedule_plan_detailed || cost_plan_detailed || quality_plan_detailed || risk_plan_detailed) ?? null,
          updatedAt: new Date().toISOString(),
      })
      .returning();
    const project = inserted[0];

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
  },
  PermissionConfigs.project.create
);

export const PUT = withPermission(
  async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      status,
      start_date,
      end_date,
      budget,
    } = body;

    const updated = await db
      .update(projectsTable)
      .set({
        name,
        description: description ?? null,
        status,
        startDate: start_date ? new Date(start_date).toISOString() : null,
        endDate: end_date ? new Date(end_date).toISOString() : null,
        budget: budget ? String(parseFloat(budget)) : null,
        notes: body.notes ?? null,
      })
      .where(eq(projectsTable.id, Number(id)))
      .returning();
    const project = updated[0];

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.project.update
);

export const DELETE = withPermission(
  async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id } = body;

    await db.delete(projectsTable).where(eq(projectsTable.id, Number(id)));

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.project.delete
);
