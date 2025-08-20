import { db } from '@/lib/db';
import { projects as projectsTable } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Re-enable RBAC middleware now that the issue is fixed
export const GET = withPermission(async (request: NextRequest) => {
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
      filters.push(
        or(
          ilike(projectsTable.name, `%${search}%`),
          ilike(projectsTable.description, `%${search}%`)
        )
      );
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
          startDate: projectsTable.startDate,
          endDate: projectsTable.endDate,
          createdAt: projectsTable.createdAt,
          updatedAt: projectsTable.updatedAt,
          customerId: projectsTable.customerId,
          notes: projectsTable.notes,
        })
      .from(projectsTable)
      .where(whereExpr as any)
      .orderBy(desc(projectsTable.createdAt))
      .offset(skip)
      .limit(limit);
    
    const countRows = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(whereExpr as any);
    
    const total = countRows.length;
    
    // Transform the data to match the frontend expectations
    const transformedProjects = rows.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || '',
      client: 'Unknown Client', // Will be updated when we join with customers table
      status: project.status,
      priority: 'medium', // Default priority since it's not in the schema
      start_date: project.startDate ? project.startDate.toString() : '',
      end_date: project.endDate ? project.endDate.toString() : '',
      budget: Number(project.budget) || 0,
      progress: 0, // Will be calculated based on tasks
      manager: 'Project Manager', // Default manager
      team_size: 0, // Will be calculated based on manpower
      location: 'Project Location', // Default location
      notes: project.notes || '',
      created_at: project.createdAt ? project.createdAt.toString() : '',
      updated_at: project.updatedAt ? project.updatedAt.toString() : '',
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        data: transformedProjects,
        current_page: page,
        last_page: totalPages,
        per_page: limit,
        total,
        next_page_url: page < totalPages ? `/api/projects?page=${page + 1}` : null,
        prev_page_url: page > 1 ? `/api/projects?page=${page - 1}` : null,
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, PermissionConfigs.project.read);

export const POST = withPermission(async (request: NextRequest) => {
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
          (notes ||
            objectives ||
            scope ||
            deliverables ||
            constraints ||
            assumptions ||
            risks ||
            quality_standards ||
            communication_plan ||
            stakeholder_management ||
            change_management ||
            procurement_plan ||
            resource_plan ||
            schedule_plan ||
            cost_plan ||
            quality_plan ||
            risk_plan ||
            communication_plan_detailed ||
            stakeholder_plan ||
            change_plan ||
            procurement_plan_detailed ||
            resource_plan_detailed ||
            schedule_plan_detailed ||
            cost_plan_detailed ||
            quality_plan_detailed ||
            risk_plan_detailed) ??
          null,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    const project = inserted[0];

    return NextResponse.json(
      {
        success: true,
        data: project,
        message: 'Project created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}, PermissionConfigs.project.create);

export const PUT = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id, name, description, status, start_date, end_date, budget } = body;

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
    
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}, PermissionConfigs.project.update);

export const DELETE = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id } = body;

    await db.delete(projectsTable).where(eq(projectsTable.id, Number(id)));

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}, PermissionConfigs.project.delete);
