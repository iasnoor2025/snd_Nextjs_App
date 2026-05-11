import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import {
  projectEquipment,
  projects,
  equipment,
  projectManpower,
  employees,
  projectEquipmentTimesheets,
} from '@/lib/drizzle/schema';
import { CentralAssignmentService } from '@/lib/services/central-assignment-service';
import { EquipmentStatusService } from '@/lib/services/equipment-status-service';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getProjectEquipmentHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where conditions
    const whereConditions = [eq(projectEquipment.projectId, parseInt(projectId))];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(projectEquipment.status, status));
    }

    // Fetch equipment with related data - now joining with projectManpower for operator info
    const projectEquipmentList = await db
      .select({
        id: projectEquipment.id,
        projectId: projectEquipment.projectId,
        equipmentId: projectEquipment.equipmentId,
        operatorId: projectEquipment.operatorId,
        startDate: projectEquipment.startDate,
        endDate: projectEquipment.endDate,
        hourlyRate: projectEquipment.hourlyRate,
        estimatedHours: projectEquipment.estimatedHours,
        actualHours: projectEquipment.actualHours,
        maintenanceCost: projectEquipment.maintenanceCost,
        fuelConsumption: projectEquipment.fuelConsumption,
        status: projectEquipment.status,
        notes: projectEquipment.notes,
        assignedBy: projectEquipment.assignedBy,
        createdAt: projectEquipment.createdAt,
        updatedAt: projectEquipment.updatedAt,
        equipmentName: equipment.name,
        equipmentModel: equipment.modelNumber,
        doorNumber: equipment.doorNumber,
        // Operator info now comes from projectManpower with proper JOIN to employees
        // Handle both employee-based and worker-based manpower records using SQL CASE
        operatorName: sql`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.firstName} ELSE NULL END`,
        operatorMiddleName: sql`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.middleName} ELSE NULL END`,
        operatorLastName: sql`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.lastName} ELSE NULL END`,
        operatorFileNumber: sql`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.fileNumber} ELSE NULL END`,
        operatorJobTitle: projectManpower.jobTitle,
        operatorEmployeeId: projectManpower.employeeId,
        operatorWorkerName: projectManpower.workerName,
      })
      .from(projectEquipment)
      .leftJoin(equipment, eq(projectEquipment.equipmentId, equipment.id))
      .leftJoin(projectManpower, eq(projectEquipment.operatorId, projectManpower.id))
      .leftJoin(employees, eq(projectManpower.employeeId, employees.id))
      .where(and(...whereConditions))
      .orderBy(desc(projectEquipment.createdAt));

    // Aggregate timesheet hours (regular + overtime) per project_equipment row, if any rows exist.
    // When timesheet entries exist they become the source of truth for usage hours/cost
    // (chosen design: "replace" the 10h/day estimate).
    //
    // Wrapped in try/catch so the endpoint still works before the project_equipment_timesheets
    // migration is applied (table missing => fall back to estimatedHours only).
    const peIds = projectEquipmentList.map(p => p.id);
    let timesheetTotalsById: Record<number, number> = {};
    if (peIds.length > 0) {
      try {
        const tsRows = await db
          .select({
            projectEquipmentId: projectEquipmentTimesheets.projectEquipmentId,
            totalHours: sql<string>`SUM(${projectEquipmentTimesheets.regularHours} + ${projectEquipmentTimesheets.overtimeHours})`,
          })
          .from(projectEquipmentTimesheets)
          .where(inArray(projectEquipmentTimesheets.projectEquipmentId, peIds))
          .groupBy(projectEquipmentTimesheets.projectEquipmentId);

        timesheetTotalsById = tsRows.reduce<Record<number, number>>((acc, row) => {
          acc[row.projectEquipmentId] = Number(row.totalHours) || 0;
          return acc;
        }, {});
      } catch (tsError: any) {
        // Most likely: table not yet created (run drizzle/0042 migration).
        // Log once and continue without timesheet totals so the equipment list still renders.
        console.warn(
          '[project equipment] timesheet aggregation skipped:',
          tsError?.message || tsError
        );
      }
    }

    // Calculate total cost for each equipment item. When timesheet hours are present they
    // override estimatedHours so the row behaves like a real timesheet-driven rental line.
    const equipmentWithCosts = projectEquipmentList.map(item => {
      const timesheetTotalHours = timesheetTotalsById[item.id] ?? 0;
      const hourlyRate = Number(item.hourlyRate) || 0;
      const maintenance = Number(item.maintenanceCost) || 0;
      const baseHours = timesheetTotalHours > 0
        ? timesheetTotalHours
        : Number(item.estimatedHours) || 0;

      return {
        ...item,
        timesheet_total_hours: timesheetTotalHours,
        timesheetTotalHours, // camelCase alias for FE convenience
        total_cost: hourlyRate * baseHours + maintenance,
        type: 'equipment',
      };
    });

    return NextResponse.json({
      success: true,
      data: equipmentWithCosts,
    });
  } catch (error) {
    console.error('Error fetching project equipment:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json({ 
      error: 'Failed to fetch project equipment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

const createProjectEquipmentHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      equipmentId,
      operatorId,
      startDate,
      endDate,
      hourlyRate,
      estimatedHours,
      notes,
    } = body;

    // Validation
    if (!equipmentId || !startDate || !hourlyRate) {
      return NextResponse.json({ error: 'Equipment ID, start date, and hourly rate are required' }, { status: 400 });
    }

    // Use central assignment service for equipment assignment (with automatic completion)
    const newEquipment = await CentralAssignmentService.createAssignment({
      type: 'equipment',
      entityId: parseInt(equipmentId),
      assignmentType: 'project',
      startDate: new Date(startDate).toISOString().split('T')[0],
      endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : undefined,
      status: 'active',
      notes: notes || '',
      projectId: parseInt(projectId),
      operatorId: operatorId ? parseInt(operatorId) : undefined,
      hourlyRate: parseFloat(hourlyRate),
    });

    // Update equipment status immediately after assignment
    try {
      await EquipmentStatusService.onAssignmentCreated(parseInt(equipmentId));
    } catch (statusError) {
      console.error('Error updating equipment status:', statusError);
      // Don't fail the assignment if status update fails
    }

    return NextResponse.json({ 
      success: true,
      data: newEquipment,
      message: 'Equipment assigned successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning equipment:', error);
    return NextResponse.json({ error: 'Failed to assign equipment' }, { status: 500 });
  }
};

export const GET = withPermission(PermissionConfigs.project.read)(getProjectEquipmentHandler);
export const POST = withPermission(PermissionConfigs.project.update)(createProjectEquipmentHandler);
