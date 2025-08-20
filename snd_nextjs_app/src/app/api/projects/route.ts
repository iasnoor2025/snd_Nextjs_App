import { db } from '@/lib/db';
import { projects as projectsTable, customers, employees } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { employees as employeesTable } from '@/lib/drizzle/schema';

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
          customerName: customers.name,
          // Project team roles
          projectManagerId: projectsTable.projectManagerId,
          projectEngineerId: projectsTable.projectEngineerId,
          projectForemanId: projectsTable.projectForemanId,
          supervisorId: projectsTable.supervisorId,
          // Employee names for roles - we'll get these separately
          customerName: customers.name,
        })
      .from(projectsTable)
      .leftJoin(customers, eq(projectsTable.customerId, customers.id))
      .where(whereExpr as any)
      .orderBy(desc(projectsTable.createdAt))
      .offset(skip)
      .limit(limit);

    // Get employee names for team roles
    const employeeIds = rows
      .map(row => [row.projectManagerId, row.projectEngineerId, row.projectForemanId, row.supervisorId])
      .flat()
      .filter(id => id !== null) as number[];

    let employeeNames: { [key: number]: string } = {};
    if (employeeIds.length > 0) {
      const uniqueEmployeeIds = [...new Set(employeeIds)];
      const employees = await db
        .select({
          id: employeesTable.id,
          firstName: employeesTable.firstName,
          lastName: employeesTable.lastName,
        })
        .from(employeesTable)
        .where(inArray(employeesTable.id, uniqueEmployeeIds));

      employeeNames = employees.reduce((acc, emp) => {
        acc[emp.id] = `${emp.firstName} ${emp.lastName}`;
        return acc;
      }, {} as { [key: number]: string });
    }
    
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
      client: project.customerName || 'No Client Assigned',
      status: project.status,
      priority: 'medium',
      start_date: project.startDate ? project.startDate.toString() : '',
      end_date: project.endDate ? project.endDate.toString() : '',
      budget: Number(project.budget) || 0,
      progress: 0,
      team_size: 0,
      location: 'Project Location',
      notes: project.notes || '',
      // Project team roles
      project_manager_id: project.projectManagerId,
      project_engineer_id: project.projectEngineerId,
      project_foreman_id: project.projectForemanId,
      supervisor_id: project.supervisorId,
      // Team member names for display
      project_manager: project.projectManagerId ? { id: project.projectManagerId, name: employeeNames[project.projectManagerId] || 'Unknown' } : null,
      project_engineer: project.projectEngineerId ? { id: project.projectEngineerId, name: employeeNames[project.projectEngineerId] || 'Unknown' } : null,
      project_foreman: project.projectForemanId ? { id: project.projectForemanId, name: employeeNames[project.projectForemanId] || 'Unknown' } : null,
      supervisor: project.supervisorId ? { id: project.supervisorId, name: employeeNames[project.supervisorId] || 'Unknown' } : null,
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
      // Project team roles
      project_manager_id,
      project_engineer_id,
      project_foreman_id,
      supervisor_id,
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
        // Project team roles
        projectManagerId: project_manager_id ? parseInt(project_manager_id) : null,
        projectEngineerId: project_engineer_id ? parseInt(project_engineer_id) : null,
        projectForemanId: project_foreman_id ? parseInt(project_foreman_id) : null,
        supervisorId: supervisor_id ? parseInt(supervisor_id) : null,
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
    console.error('Error creating project:', error);
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
