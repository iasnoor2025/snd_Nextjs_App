import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import {
  projects,
  projectEquipment,
  equipment,
  projectManpower,
  employees,
  projectEquipmentTimesheets,
  projectEquipmentTimesheetReceived,
} from '@/lib/drizzle/schema';
import { eq, and, sql, inArray, gte, lte } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// GET /api/projects/[id]/equipment-timesheets/report?month=YYYY-MM
// Aggregated per-equipment monthly view used by the "Monthly Report" PDF.
const getProjectEquipmentMonthlyReportHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
      return NextResponse.json(
        { error: 'month (YYYY-MM) is required' },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split('-').map(Number);
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // Project header
    const projectRows = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (projectRows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // All project_equipment rows for this project + operator info, like the equipment list route
    const peList = await db
      .select({
        id: projectEquipment.id,
        projectId: projectEquipment.projectId,
        equipmentId: projectEquipment.equipmentId,
        startDate: projectEquipment.startDate,
        endDate: projectEquipment.endDate,
        hourlyRate: projectEquipment.hourlyRate,
        maintenanceCost: projectEquipment.maintenanceCost,
        status: projectEquipment.status,
        equipmentName: equipment.name,
        doorNumber: equipment.doorNumber,
        modelNumber: equipment.modelNumber,
        operatorName: sql<string | null>`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.firstName} ELSE NULL END`,
        operatorMiddleName: sql<string | null>`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.middleName} ELSE NULL END`,
        operatorLastName: sql<string | null>`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.lastName} ELSE NULL END`,
        operatorFileNumber: sql<string | null>`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.fileNumber} ELSE NULL END`,
        operatorWorkerName: projectManpower.workerName,
      })
      .from(projectEquipment)
      .leftJoin(equipment, eq(projectEquipment.equipmentId, equipment.id))
      .leftJoin(projectManpower, eq(projectEquipment.operatorId, projectManpower.id))
      .leftJoin(employees, eq(projectManpower.employeeId, employees.id))
      .where(eq(projectEquipment.projectId, projectId));

    const peIds = peList.map(p => p.id);

    // Per-row monthly aggregates (regular + overtime hours within the month)
    const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let totalsById: Record<number, { regular: number; overtime: number }> = {};
    if (peIds.length > 0) {
      try {
        const rows = await db
          .select({
            projectEquipmentId: projectEquipmentTimesheets.projectEquipmentId,
            regularSum: sql<string>`COALESCE(SUM(${projectEquipmentTimesheets.regularHours}), 0)`,
            overtimeSum: sql<string>`COALESCE(SUM(${projectEquipmentTimesheets.overtimeHours}), 0)`,
          })
          .from(projectEquipmentTimesheets)
          .where(
            and(
              inArray(projectEquipmentTimesheets.projectEquipmentId, peIds),
              gte(projectEquipmentTimesheets.date, startDateStr),
              lte(projectEquipmentTimesheets.date, endDateStr)
            )
          )
          .groupBy(projectEquipmentTimesheets.projectEquipmentId);

        totalsById = rows.reduce<Record<number, { regular: number; overtime: number }>>(
          (acc, r) => {
            acc[r.projectEquipmentId] = {
              regular: Number(r.regularSum) || 0,
              overtime: Number(r.overtimeSum) || 0,
            };
            return acc;
          },
          {}
        );
      } catch (e: any) {
        // Table may not exist yet (migration not run). Fall through with empty totals.
        console.warn(
          '[project equipment monthly report] aggregation skipped:',
          e?.message || e
        );
      }
    }

    // Per-row received flag for the month
    let receivedById: Record<number, boolean> = {};
    if (peIds.length > 0) {
      try {
        const rows = await db
          .select({
            projectEquipmentId: projectEquipmentTimesheetReceived.projectEquipmentId,
            received: projectEquipmentTimesheetReceived.received,
          })
          .from(projectEquipmentTimesheetReceived)
          .where(
            and(
              inArray(projectEquipmentTimesheetReceived.projectEquipmentId, peIds),
              eq(projectEquipmentTimesheetReceived.month, month)
            )
          );

        receivedById = rows.reduce<Record<number, boolean>>((acc, r) => {
          acc[r.projectEquipmentId] = !!r.received;
          return acc;
        }, {});
      } catch (e: any) {
        console.warn(
          '[project equipment monthly report] received lookup skipped:',
          e?.message || e
        );
      }
    }

    // Compose per-equipment rows
    const items = peList.map(pe => {
      const totals = totalsById[pe.id] ?? { regular: 0, overtime: 0 };
      const regularHours = totals.regular;
      const overtimeHours = totals.overtime;
      const totalHours = regularHours + overtimeHours;
      const hourlyRate = Number(pe.hourlyRate) || 0;
      const maintenanceCost = Number(pe.maintenanceCost) || 0;
      // Same hourlyRate for regular + OT per the chosen design.
      const monthlyCost = hourlyRate * totalHours + (totalHours > 0 ? maintenanceCost : 0);

      const operatorFull = pe.operatorName
        ? [pe.operatorName, pe.operatorMiddleName, pe.operatorLastName]
            .filter(Boolean)
            .join(' ')
            .trim()
        : pe.operatorWorkerName || null;

      return {
        projectEquipmentId: pe.id,
        equipmentId: pe.equipmentId,
        equipmentName: pe.equipmentName || 'Unknown',
        doorNumber: pe.doorNumber || null,
        modelNumber: pe.modelNumber || null,
        operatorName: operatorFull,
        operatorFileNumber: pe.operatorFileNumber || null,
        startDate: pe.startDate,
        endDate: pe.endDate,
        hourlyRate,
        regularHours,
        overtimeHours,
        totalHours,
        monthlyCost,
        received: receivedById[pe.id] ?? false,
        status: pe.status,
      };
    });

    // Sort by door number when present, falling back to name
    items.sort((a, b) => {
      const numA = a.doorNumber ? parseInt(a.doorNumber, 10) : NaN;
      const numB = b.doorNumber ? parseInt(b.doorNumber, 10) : NaN;
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
      if (!Number.isNaN(numA)) return -1;
      if (!Number.isNaN(numB)) return 1;
      return a.equipmentName.localeCompare(b.equipmentName);
    });

    const summary = items.reduce(
      (acc, it) => {
        acc.totalEquipment++;
        acc.totalRegularHours += it.regularHours;
        acc.totalOvertimeHours += it.overtimeHours;
        acc.totalHours += it.totalHours;
        acc.totalCost += it.monthlyCost;
        if (it.totalHours > 0) acc.withHours++;
        if (it.received) acc.received++;
        return acc;
      },
      {
        totalEquipment: 0,
        withHours: 0,
        received: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalHours: 0,
        totalCost: 0,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        project: projectRows[0],
        month,
        items,
        summary,
      },
    });
  } catch (error: any) {
    console.error('Error generating project equipment monthly report:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate project equipment monthly report',
        details: error.message,
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.project.read)(
  getProjectEquipmentMonthlyReportHandler
);
