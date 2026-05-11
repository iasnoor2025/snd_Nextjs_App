import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import {
  projectEquipment,
  projectEquipmentTimesheets,
  projectEquipmentTimesheetReceived,
} from '@/lib/drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// GET /api/projects/[id]/equipment-timesheets?projectEquipmentId=X&month=YYYY-MM
// Returns daily entries (optionally filtered by month) plus the received flag for that month.
const getProjectEquipmentTimesheetsHandler = async (
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
    const projectEquipmentIdParam = searchParams.get('projectEquipmentId');
    const month = searchParams.get('month'); // YYYY-MM

    if (!projectEquipmentIdParam) {
      return NextResponse.json(
        { error: 'projectEquipmentId is required' },
        { status: 400 }
      );
    }

    const projectEquipmentId = parseInt(projectEquipmentIdParam);
    if (!projectEquipmentId || Number.isNaN(projectEquipmentId)) {
      return NextResponse.json({ error: 'Invalid projectEquipmentId' }, { status: 400 });
    }

    const conditions = [
      eq(projectEquipmentTimesheets.projectId, projectId),
      eq(projectEquipmentTimesheets.projectEquipmentId, projectEquipmentId),
    ];

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      conditions.push(gte(projectEquipmentTimesheets.date, startDateStr));
      conditions.push(lte(projectEquipmentTimesheets.date, endDateStr));
    }

    const timesheets = await db
      .select()
      .from(projectEquipmentTimesheets)
      .where(and(...conditions))
      .orderBy(projectEquipmentTimesheets.date);

    // Look up the per-month received flag (only when month is provided)
    let received = false;
    if (month) {
      const receivedRow = await db
        .select()
        .from(projectEquipmentTimesheetReceived)
        .where(
          and(
            eq(projectEquipmentTimesheetReceived.projectEquipmentId, projectEquipmentId),
            eq(projectEquipmentTimesheetReceived.month, month)
          )
        )
        .limit(1);
      received = receivedRow.length > 0 ? receivedRow[0].received : false;
    }

    return NextResponse.json({
      success: true,
      data: timesheets,
      received,
    });
  } catch (error: any) {
    console.error('Error fetching project equipment timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project equipment timesheets', details: error.message },
      { status: 500 }
    );
  }
};

// DELETE /api/projects/[id]/equipment-timesheets?projectEquipmentId=X&month=YYYY-MM
// Or:    DELETE /api/projects/[id]/equipment-timesheets?projectEquipmentId=X&date=YYYY-MM-DD
//
// Wipes daily entries for that project_equipment row for either the whole month or one date.
// When clearing a full month, the matching project_equipment_timesheet_received row is also reset
// to received = false so the UI can no longer show "imported" for an empty month.
const deleteProjectEquipmentTimesheetsHandler = async (
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
    const projectEquipmentIdParam = searchParams.get('projectEquipmentId');
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    if (!projectEquipmentIdParam) {
      return NextResponse.json(
        { error: 'projectEquipmentId is required' },
        { status: 400 }
      );
    }

    const projectEquipmentId = parseInt(projectEquipmentIdParam);
    if (!projectEquipmentId || Number.isNaN(projectEquipmentId)) {
      return NextResponse.json({ error: 'Invalid projectEquipmentId' }, { status: 400 });
    }

    if (!month && !date) {
      return NextResponse.json(
        { error: 'Either month (YYYY-MM) or date (YYYY-MM-DD) is required' },
        { status: 400 }
      );
    }

    // Verify the project_equipment row belongs to this project so a user can't delete other
    // projects' data via a forged projectEquipmentId.
    const pe = await db
      .select({ id: projectEquipment.id })
      .from(projectEquipment)
      .where(
        and(
          eq(projectEquipment.id, projectEquipmentId),
          eq(projectEquipment.projectId, projectId)
        )
      )
      .limit(1);

    if (pe.length === 0) {
      return NextResponse.json(
        { error: 'Project equipment row not found for this project' },
        { status: 404 }
      );
    }

    let deleted = 0;

    if (date) {
      // Single-day delete
      const result = await db
        .delete(projectEquipmentTimesheets)
        .where(
          and(
            eq(projectEquipmentTimesheets.projectEquipmentId, projectEquipmentId),
            eq(projectEquipmentTimesheets.date, date)
          )
        )
        .returning({ id: projectEquipmentTimesheets.id });
      deleted = result.length;
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: 'Invalid month format. Use YYYY-MM' },
          { status: 400 }
        );
      }
      const startDateStr = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const result = await db
        .delete(projectEquipmentTimesheets)
        .where(
          and(
            eq(projectEquipmentTimesheets.projectEquipmentId, projectEquipmentId),
            gte(projectEquipmentTimesheets.date, startDateStr),
            lte(projectEquipmentTimesheets.date, endDateStr)
          )
        )
        .returning({ id: projectEquipmentTimesheets.id });
      deleted = result.length;

      // Reset the per-month received flag for this row.
      await db
        .update(projectEquipmentTimesheetReceived)
        .set({
          received: false,
          receivedAt: null,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(
          and(
            eq(projectEquipmentTimesheetReceived.projectEquipmentId, projectEquipmentId),
            eq(projectEquipmentTimesheetReceived.month, month)
          )
        );
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error('Error deleting project equipment timesheets:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete project equipment timesheets',
        details: error.message,
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.project.read)(
  getProjectEquipmentTimesheetsHandler
);

export const DELETE = withPermission(PermissionConfigs.project.update)(
  deleteProjectEquipmentTimesheetsHandler
);
