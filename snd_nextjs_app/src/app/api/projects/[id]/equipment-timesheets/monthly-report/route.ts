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
import { eq, and, sql, inArray } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { format } from 'date-fns';

// GET /api/projects/[id]/equipment-timesheets/monthly-report
//
// Builds the data for the Project Resources "Monthly Items Report" tab:
// every month a piece of equipment was active in the project (from its
// start_date through end_date or today), with daily timesheet hours rolled
// up per (equipment, month), and per-month received status.
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

    const projectRows = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (projectRows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // All project_equipment rows + operator info for this project
    const peList = await db
      .select({
        id: projectEquipment.id,
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

    // Per-(project_equipment, month) totals across the whole project. We expand
    // each daily entry into its YYYY-MM bucket in SQL with to_char.
    let totalsByPeMonth: Record<string, { regular: number; overtime: number }> = {};
    if (peIds.length > 0) {
      try {
        const rows = await db
          .select({
            projectEquipmentId: projectEquipmentTimesheets.projectEquipmentId,
            month: sql<string>`to_char(${projectEquipmentTimesheets.date}, 'YYYY-MM')`,
            regularSum: sql<string>`COALESCE(SUM(${projectEquipmentTimesheets.regularHours}), 0)`,
            overtimeSum: sql<string>`COALESCE(SUM(${projectEquipmentTimesheets.overtimeHours}), 0)`,
          })
          .from(projectEquipmentTimesheets)
          .where(inArray(projectEquipmentTimesheets.projectEquipmentId, peIds))
          .groupBy(
            projectEquipmentTimesheets.projectEquipmentId,
            sql`to_char(${projectEquipmentTimesheets.date}, 'YYYY-MM')`
          );

        totalsByPeMonth = rows.reduce<Record<string, { regular: number; overtime: number }>>(
          (acc, r) => {
            acc[`${r.projectEquipmentId}-${r.month}`] = {
              regular: Number(r.regularSum) || 0,
              overtime: Number(r.overtimeSum) || 0,
            };
            return acc;
          },
          {}
        );
      } catch (e: any) {
        console.warn(
          '[project equipment monthly-report] hours aggregation skipped:',
          e?.message || e
        );
      }
    }

    // Per-(project_equipment, month) received flags
    let receivedByKey: Record<string, boolean> = {};
    if (peIds.length > 0) {
      try {
        const rows = await db
          .select({
            projectEquipmentId: projectEquipmentTimesheetReceived.projectEquipmentId,
            month: projectEquipmentTimesheetReceived.month,
            received: projectEquipmentTimesheetReceived.received,
          })
          .from(projectEquipmentTimesheetReceived)
          .where(inArray(projectEquipmentTimesheetReceived.projectEquipmentId, peIds));

        receivedByKey = rows.reduce<Record<string, boolean>>((acc, r) => {
          acc[`${r.projectEquipmentId}-${r.month}`] = !!r.received;
          return acc;
        }, {});
      } catch (e: any) {
        console.warn(
          '[project equipment monthly-report] received lookup skipped:',
          e?.message || e
        );
      }
    }

    // Build months covered by ALL project_equipment rows.
    // Each PE row contributes months from startDate -> endDate (or today).
    //
    // For every (PE, month) pair we compute the rental-style monthly slice:
    //   - effectiveStartDate = max(PE.startDate, monthStart)
    //   - effectiveEndDate   = min(PE.endDate || today, monthEnd)
    //   - durationDays       = inclusive day count of the overlap
    //   - usageHours         = timesheet hours when present, else durationDays * 10
    //   - monthlyCost        = hourlyRate * usageHours (+ maintenance if any activity)
    //
    // This mirrors the rental "Items report" math so the figures shown for
    // project equipment behave the same way users are already used to.
    type ReportItem = {
      projectEquipmentId: number;
      equipmentId: number | null;
      equipmentName: string;
      doorNumber: string | null;
      modelNumber: string | null;
      operatorName: string | null;
      operatorFileNumber: string | null;
      startDate: string | null;          // PE.start_date (raw)
      endDate: string | null;            // PE.end_date (raw, may be null)
      effectiveStartDate: string | null; // start within this month
      effectiveEndDate: string | null;   // end within this month (capped at today / monthEnd)
      durationDays: number;              // inclusive day count for this month
      hourlyRate: number;
      maintenanceCost: number;
      regularHours: number;              // raw timesheet hours (kept for PDF / dialogs)
      overtimeHours: number;
      timesheetHours: number;            // regular + overtime
      usageHours: number;                // timesheet hours OR durationDays * 10
      isManualHours: boolean;            // true when a timesheet was entered for this month
      monthlyCost: number;
      received: boolean;
      status: string | null;
    };
    type ReportMonth = {
      monthKey: string;
      monthLabel: string;
      items: ReportItem[];
      summary: {
        totalEquipment: number;
        withHours: number;        // # of rows with manual timesheet hours this month
        active: number;           // # of rows with any duration in the month
        received: number;
        totalDurationDays: number;
        totalRegularHours: number;
        totalOvertimeHours: number;
        totalUsageHours: number;
        totalCost: number;
      };
    };

    const monthsMap: Record<string, ReportMonth> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Local-date parser to avoid TZ drift on YYYY-MM-DD strings
    const parseLocalDate = (s: string): Date => {
      const onlyDate = s.split('T')[0];
      const [yy, mm, dd] = onlyDate.split('-').map(Number);
      return new Date(yy, (mm || 1) - 1, dd || 1);
    };

    const fmtIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    for (const pe of peList) {
      if (!pe.startDate) continue;
      const start = parseLocalDate(pe.startDate);
      if (Number.isNaN(start.getTime())) continue;

      let endRef: Date;
      if (pe.endDate) {
        const parsedEnd = parseLocalDate(pe.endDate);
        if (!Number.isNaN(parsedEnd.getTime())) {
          endRef = parsedEnd > today ? today : parsedEnd;
        } else {
          endRef = today;
        }
      } else {
        endRef = today;
      }

      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(endRef.getFullYear(), endRef.getMonth(), 1);

      const hourlyRate = Number(pe.hourlyRate) || 0;
      const maintenanceCost = Number(pe.maintenanceCost) || 0;

      const operatorFull = pe.operatorName
        ? [pe.operatorName, pe.operatorMiddleName, pe.operatorLastName]
            .filter(Boolean)
            .join(' ')
            .trim()
        : pe.operatorWorkerName || null;

      while (cursor <= endMonth) {
        const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = format(cursor, 'MMMM yyyy');

        if (!monthsMap[monthKey]) {
          monthsMap[monthKey] = {
            monthKey,
            monthLabel,
            items: [],
            summary: {
              totalEquipment: 0,
              withHours: 0,
              active: 0,
              received: 0,
              totalDurationDays: 0,
              totalRegularHours: 0,
              totalOvertimeHours: 0,
              totalUsageHours: 0,
              totalCost: 0,
            },
          };
        }

        // Window for this calendar month
        const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0); // last day

        // Effective overlap between PE life and this month
        const effStart = start > monthStart ? new Date(start) : new Date(monthStart);
        let effEnd = endRef < monthEnd ? new Date(endRef) : new Date(monthEnd);
        if (effEnd > today) effEnd = new Date(today); // never project into the future
        effStart.setHours(0, 0, 0, 0);
        effEnd.setHours(0, 0, 0, 0);

        let durationDays = 0;
        if (effStart <= effEnd) {
          const ms = effEnd.getTime() - effStart.getTime();
          durationDays = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1; // inclusive
        }

        const ts = totalsByPeMonth[`${pe.id}-${monthKey}`] ?? { regular: 0, overtime: 0 };
        const timesheetHours = ts.regular + ts.overtime;
        const isManualHours = timesheetHours > 0;

        // Mirrors rental rule: timesheet wins, else 10h/day calendar duration.
        const usageHours = isManualHours ? timesheetHours : durationDays * 10;
        const monthlyCost =
          hourlyRate * usageHours + (durationDays > 0 ? maintenanceCost : 0);
        const received = receivedByKey[`${pe.id}-${monthKey}`] ?? false;

        const item: ReportItem = {
          projectEquipmentId: pe.id,
          equipmentId: pe.equipmentId,
          equipmentName: pe.equipmentName || 'Unknown',
          doorNumber: pe.doorNumber || null,
          modelNumber: pe.modelNumber || null,
          operatorName: operatorFull,
          operatorFileNumber: pe.operatorFileNumber || null,
          startDate: pe.startDate,
          endDate: pe.endDate,
          effectiveStartDate: durationDays > 0 ? fmtIso(effStart) : null,
          effectiveEndDate: durationDays > 0 ? fmtIso(effEnd) : null,
          durationDays,
          hourlyRate,
          maintenanceCost,
          regularHours: ts.regular,
          overtimeHours: ts.overtime,
          timesheetHours,
          usageHours,
          isManualHours,
          monthlyCost,
          received,
          status: pe.status,
        };

        const m = monthsMap[monthKey];
        m.items.push(item);
        m.summary.totalEquipment++;
        if (durationDays > 0) m.summary.active++;
        if (isManualHours) m.summary.withHours++;
        if (received) m.summary.received++;
        m.summary.totalDurationDays += durationDays;
        m.summary.totalRegularHours += ts.regular;
        m.summary.totalOvertimeHours += ts.overtime;
        m.summary.totalUsageHours += usageHours;
        m.summary.totalCost += monthlyCost;

        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    // Sort each month's items by door number, then name
    Object.values(monthsMap).forEach(m => {
      m.items.sort((a, b) => {
        const numA = a.doorNumber ? parseInt(a.doorNumber, 10) : NaN;
        const numB = b.doorNumber ? parseInt(b.doorNumber, 10) : NaN;
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
        if (!Number.isNaN(numA)) return -1;
        if (!Number.isNaN(numB)) return 1;
        return a.equipmentName.localeCompare(b.equipmentName);
      });
    });

    // Most recent month first
    const months: ReportMonth[] = Object.values(monthsMap).sort((a, b) =>
      b.monthKey.localeCompare(a.monthKey)
    );

    return NextResponse.json({
      success: true,
      data: {
        project: projectRows[0],
        months,
      },
    });
  } catch (error: any) {
    console.error('Error building project equipment monthly-report:', error);
    return NextResponse.json(
      {
        error: 'Failed to build project equipment monthly-report',
        details: error.message,
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.project.read)(
  getProjectEquipmentMonthlyReportHandler
);
