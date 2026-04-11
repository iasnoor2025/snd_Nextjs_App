import { db } from '@/lib/drizzle';
import { projects as projectsTable, customers, locations } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { employees as employeesTable } from '@/lib/drizzle/schema';
import { AuditService } from '@/lib/services/audit-service';
import { getServerSession } from '@/lib/auth';

function isMissingPriorityColumnError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes('42703') ||
    msg.includes('does not exist') ||
    (msg.includes('column') && msg.includes('priority'))
  );
}

type ProjectListRow = {
  id: number;
  name: string | null;
  description: string | null;
  status: string | null;
  priority?: string | null;
  budget: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  customerId: number | null;
  locationId: number | null;
  notes: string | null;
  customerName: string | null;
  locationName: string | null;
  locationCity: string | null;
  locationState: string | null;
  projectManagerId: number | null;
  projectEngineerId: number | null;
  projectForemanId: number | null;
  supervisorId: number | null;
};

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

    const buildFilters = (opts: { includePriority: boolean }) => {
      const filters: SQL[] = [];
      if (search) {
        const searchCond = or(
          ilike(projectsTable.name, `%${search}%`),
          ilike(projectsTable.description, `%${search}%`)
        );
        if (searchCond) filters.push(searchCond);
      }
      if (status && status !== 'all') {
        filters.push(eq(projectsTable.status, status));
      }
      if (opts.includePriority && priority && priority !== 'all') {
        filters.push(eq(projectsTable.priority, priority));
      }
      return filters.length ? and(...filters) : undefined;
    };

    const runListQuery = async (includePriority: boolean): Promise<ProjectListRow[]> => {
      const whereExpr = buildFilters({ includePriority });
      const baseSelect = {
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
        locationId: projectsTable.locationId,
        notes: projectsTable.notes,
        customerName: customers.name,
        locationName: locations.name,
        locationCity: locations.city,
        locationState: locations.state,
        projectManagerId: projectsTable.projectManagerId,
        projectEngineerId: projectsTable.projectEngineerId,
        projectForemanId: projectsTable.projectForemanId,
        supervisorId: projectsTable.supervisorId,
        ...(includePriority ? { priority: projectsTable.priority } : {}),
      };

      const base = db
        .select(baseSelect as any)
        .from(projectsTable)
        .leftJoin(customers, eq(projectsTable.customerId, customers.id))
        .leftJoin(locations, eq(projectsTable.locationId, locations.id));

      const q = whereExpr ? base.where(whereExpr) : base;
      return (await q.orderBy(desc(projectsTable.createdAt)).offset(skip).limit(limit)) as unknown as ProjectListRow[];
    };

    const runCount = async (): Promise<number> => {
      const whereExpr = buildFilters({ includePriority: true });
      const base = db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(projectsTable);
      const row = await (whereExpr ? base.where(whereExpr) : base);
      return Number(row[0]?.count ?? 0);
    };

    let rows: ProjectListRow[];
    let total: number;
    try {
      rows = await runListQuery(true);
      total = await runCount();
    } catch (firstErr) {
      if (!isMissingPriorityColumnError(firstErr)) {
        throw firstErr;
      }
      console.warn(
        '[GET /api/projects] priority column missing; listing without priority. Run migration if needed.'
      );
      const whereExprFallback = buildFilters({ includePriority: false });
      const baseSelectNoPri = {
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
        locationId: projectsTable.locationId,
        notes: projectsTable.notes,
        customerName: customers.name,
        locationName: locations.name,
        locationCity: locations.city,
        locationState: locations.state,
        projectManagerId: projectsTable.projectManagerId,
        projectEngineerId: projectsTable.projectEngineerId,
        projectForemanId: projectsTable.projectForemanId,
        supervisorId: projectsTable.supervisorId,
      };
      const base = db
        .select(baseSelectNoPri)
        .from(projectsTable)
        .leftJoin(customers, eq(projectsTable.customerId, customers.id))
        .leftJoin(locations, eq(projectsTable.locationId, locations.id));
      const q = whereExprFallback ? base.where(whereExprFallback) : base;
      rows = (await q.orderBy(desc(projectsTable.createdAt)).offset(skip).limit(limit)) as unknown as ProjectListRow[];
      rows = rows.map(r => ({ ...r, priority: 'medium' }));
      const countBase = db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(projectsTable);
      const countRow = await (whereExprFallback ? countBase.where(whereExprFallback) : countBase);
      total = Number(countRow[0]?.count ?? 0);
    }

    // Get employee names for team roles
    const employeeIds = rows
      .map(row => [row.projectManagerId, row.projectEngineerId, row.projectForemanId, row.supervisorId])
      .flat()
      .filter(id => id !== null) as number[];

    let employeeNames: { [key: number]: string } = {};
    if (employeeIds.length > 0) {
      const uniqueEmployeeIds = [...new Set(employeeIds)];
      const employeeRows = await db
        .select({
          id: employeesTable.id,
          firstName: employeesTable.firstName,
          lastName: employeesTable.lastName,
        })
        .from(employeesTable)
        .where(inArray(employeesTable.id, uniqueEmployeeIds));

      employeeNames = employeeRows.reduce((acc, emp) => {
        acc[emp.id] = `${emp.firstName} ${emp.lastName}`;
        return acc;
      }, {} as { [key: number]: string });
    }

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
      priority: bodyPriority,
    } = body;

    const insertedRows = await db
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
        priority:
          bodyPriority !== undefined && bodyPriority !== null && String(bodyPriority).trim() !== ''
            ? String(bodyPriority)
            : 'medium',
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
    const project = insertedRows[0];
    if (!project) {
      return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
    }

    // Log the creation (must not fail the request — project already persisted)
    try {
      const session = await getServerSession();
      await AuditService.logCRUD('create', 'Project', String(project.id), `Project "${name}" created`, {
        userId: session?.user?.id,
        userName: session?.user?.name || undefined,
        changes: {
          after: {
            id: project.id,
            name: project.name,
            status: project.status,
            priority: project.priority,
          },
        },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });
    } catch (auditErr) {
      console.error('[POST /api/projects] Audit log failed (project still created):', auditErr);
    }

    const data = {
      id: project.id,
      name: project.name,
      description: project.description,
      customerId: project.customerId,
      locationId: project.locationId,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      priority: project.priority,
      budget: project.budget,
      notes: project.notes,
      projectManagerId: project.projectManagerId,
      projectEngineerId: project.projectEngineerId,
      projectForemanId: project.projectForemanId,
      supervisorId: project.supervisorId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt,
    };

    return NextResponse.json(
      {
        success: true,
        data,
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
