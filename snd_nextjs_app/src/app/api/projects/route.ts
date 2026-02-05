import { db } from '@/lib/drizzle';
import { projects as projectsTable, customers, employees, locations } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { employees as employeesTable } from '@/lib/drizzle/schema';
import { AuditService } from '@/lib/services/audit-service';
import { getServerSession } from '@/lib/auth';

// GET /api/projects - List projects with pagination and filters
const getProjectsHandler = async (request: NextRequest) => {
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
    if (priority && priority !== 'all') {
      filters.push(eq(projectsTable.priority, priority));
    }
    const whereExpr = filters.length ? and(...filters) : undefined;

    const rows = await db
      .select({
        id: projectsTable.id,
        name: projectsTable.name,
        description: projectsTable.description,
        status: projectsTable.status,
        priority: projectsTable.priority,
        budget: projectsTable.budget,
        startDate: projectsTable.startDate,
        endDate: projectsTable.endDate,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
        customerId: projectsTable.customerId,
        locationId: projectsTable.locationId,
        notes: projectsTable.notes,
        customerName: customers.name,
        locationName: locations.name,
        locationCity: locations.city,
        locationState: locations.state,
        // Project team roles
        projectManagerId: projectsTable.projectManagerId,
        projectEngineerId: projectsTable.projectEngineerId,
        projectForemanId: projectsTable.projectForemanId,
        supervisorId: projectsTable.supervisorId,
      })
      .from(projectsTable)
      .leftJoin(customers, eq(projectsTable.customerId, customers.id))
      .leftJoin(locations, eq(projectsTable.locationId, locations.id))
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

    // Helper function to calculate progress based on dates
    const calculateProgress = (startDate: any, endDate: any, status: string): number => {
      // If project is completed, return 100%
      if (status === 'completed') return 100;

      // If no dates, return 0
      if (!startDate || !endDate) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Parse dates
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      // If project hasn't started yet, return 0
      if (today < start) return 0;

      // If project is past end date, return 100% (unless already completed)
      if (today > end) return 100;

      // Calculate progress based on elapsed time
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (totalDays <= 0) return 0;

      const progress = Math.round((daysElapsed / totalDays) * 100);
      return Math.min(100, Math.max(0, progress));
    };

    // Transform the data to match the frontend expectations
    const enhancedRows = rows.map(project => {
      // Format dates as YYYY-MM-DD to avoid timezone issues
      // PostgreSQL date type returns string like "2025-12-01" - just use it directly
      const formatDateString = (date: any): string => {
        if (!date) return '';
        // If it's already a string, just take the date part (before T if present)
        const dateStr = String(date);
        // Handle both "2025-12-01" and "2025-12-01T00:00:00.000Z" formats
        return dateStr.split('T')[0];
      };

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        client: project.customerName || 'No Client Assigned',
        status: project.status,
        priority: project.priority || 'medium',
        start_date: formatDateString(project.startDate),
        end_date: formatDateString(project.endDate),
        budget: Number(project.budget) || 0,
        progress: calculateProgress(project.startDate, project.endDate, project.status),
        team_size: 0,
        location: project.locationId && project.locationName ? `${project.locationName}, ${project.locationCity}, ${project.locationState}` : 'Project Location',
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
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        data: enhancedRows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// POST /api/projects - Create new project
const createProjectHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      name,
      description,
      customer_id,
      location_id,
      start_date,
      end_date,
      status,
      budget,
      project_manager_id,
      project_engineer_id,
      project_foreman_id,
      supervisor_id,
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

    const [inserted] = await db
      .insert(projectsTable)
      .values({
        name,
        description: description ?? null,
        customerId: customer_id ? parseInt(customer_id) : null,
        locationId: location_id ? parseInt(location_id) : null,
        // Store dates as YYYY-MM-DD strings to avoid timezone issues
        startDate: start_date ? start_date.split('T')[0] : null,
        endDate: end_date ? end_date.split('T')[0] : null,
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

    // Log the creation
    const session = await getServerSession();
    await AuditService.logCRUD('create', 'Project', String(project.id), `Project "${name}" created`, {
      userId: session?.user?.id,
      userName: session?.user?.name || undefined,
      changes: { after: project },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

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
};

// PUT /api/projects - Update project
const updateProjectHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id, name, description, status, start_date, end_date, budget } = body;

    const updated = await db
      .update(projectsTable)
      .set({
        name,
        description: description ?? null,
        status,
        // Store dates as YYYY-MM-DD strings to avoid timezone issues
        startDate: start_date ? start_date.split('T')[0] : null,
        endDate: end_date ? end_date.split('T')[0] : null,
        budget: budget ? String(parseFloat(budget)) : null,
        notes: body.notes ?? null,
      })
      .where(eq(projectsTable.id, Number(id)))
      .returning();
    const project = updated[0];

    // Log the update
    const session = await getServerSession();
    await AuditService.logCRUD('update', 'Project', String(id), `Project "${project.name}" updated`, {
      userId: session?.user?.id,
      userName: session?.user?.name || undefined,
      changes: { after: project },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
};

// DELETE /api/projects - Delete project
const deleteProjectHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id } = body;

    await db.delete(projectsTable).where(eq(projectsTable.id, Number(id)));

    // Log the deletion
    const session = await getServerSession();
    await AuditService.logCRUD('delete', 'Project', String(id), `Project ID ${id} deleted`, {
      userId: session?.user?.id,
      userName: session?.user?.name || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
};

export const GET = withPermission(PermissionConfigs.project.read)(getProjectsHandler);
export const POST = withPermission(PermissionConfigs.project.create)(createProjectHandler);
export const PUT = withPermission(PermissionConfigs.project.update)(updateProjectHandler);
export const DELETE = withPermission(PermissionConfigs.project.delete)(deleteProjectHandler);
