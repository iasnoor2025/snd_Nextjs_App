import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/drizzle';
import {
  projectEquipment,
  projectEquipmentTimesheets,
  projectEquipmentTimesheetReceived,
} from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

interface ProjectEquipmentTimesheetImportData {
  projectEquipmentId: number;
  month: string; // YYYY-MM
  dailyHours: Array<{
    date: string; // YYYY-MM-DD
    regularHours: number | string; // number or "F" for Friday/off
    overtimeHours: number | string;
  }>;
}

const importProjectEquipmentTimesheetHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const body = await request.json();
    const { projectEquipmentId, month, dailyHours } =
      body as ProjectEquipmentTimesheetImportData;

    if (!projectEquipmentId || !month || !dailyHours || !Array.isArray(dailyHours)) {
      return NextResponse.json(
        { error: 'projectEquipmentId, month, and dailyHours array are required' },
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

    // Verify the project_equipment row belongs to this project
    const peRows = await db
      .select()
      .from(projectEquipment)
      .where(
        and(
          eq(projectEquipment.id, projectEquipmentId),
          eq(projectEquipment.projectId, projectId)
        )
      )
      .limit(1);

    if (peRows.length === 0) {
      return NextResponse.json(
        { error: 'Project equipment row not found or does not belong to this project' },
        { status: 404 }
      );
    }

    const pe = peRows[0];

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const dayData of dailyHours) {
      try {
        const date = new Date(dayData.date);
        const dateYear = date.getFullYear();
        const dateMonth = date.getMonth() + 1;

        if (dateYear !== year || dateMonth !== monthNum) {
          results.errors.push(
            `Date ${dayData.date} does not belong to month ${month}. Skipping.`
          );
          continue;
        }

        // "F"/empty => 0 regular hours (Friday/off)
        let regularHours = 0;
        if (
          dayData.regularHours === 'F' ||
          dayData.regularHours === 'Fri' ||
          dayData.regularHours === '' ||
          dayData.regularHours === null ||
          dayData.regularHours === undefined
        ) {
          regularHours = 0;
        } else {
          regularHours = parseFloat(dayData.regularHours.toString()) || 0;
        }

        const overtimeHours = parseFloat((dayData.overtimeHours ?? 0).toString()) || 0;
        const dateStr = date.toISOString().split('T')[0];

        const existing = await db
          .select()
          .from(projectEquipmentTimesheets)
          .where(
            and(
              eq(projectEquipmentTimesheets.projectEquipmentId, projectEquipmentId),
              eq(projectEquipmentTimesheets.date, dateStr)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(projectEquipmentTimesheets)
            .set({
              regularHours: regularHours.toString(),
              overtimeHours: overtimeHours.toString(),
              updatedAt: new Date().toISOString().split('T')[0],
            })
            .where(eq(projectEquipmentTimesheets.id, existing[0].id));
          results.updated++;
        } else {
          await db.insert(projectEquipmentTimesheets).values({
            projectEquipmentId,
            projectId,
            equipmentId: pe.equipmentId,
            date: dateStr,
            regularHours: regularHours.toString(),
            overtimeHours: overtimeHours.toString(),
            createdBy: parseInt(session.user.id),
            updatedAt: new Date().toISOString().split('T')[0],
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push(`Error processing ${dayData.date}: ${error.message}`);
      }
    }

    // Upsert the per-month "received" flag for this row
    const existingReceived = await db
      .select()
      .from(projectEquipmentTimesheetReceived)
      .where(
        and(
          eq(projectEquipmentTimesheetReceived.projectEquipmentId, projectEquipmentId),
          eq(projectEquipmentTimesheetReceived.month, month)
        )
      )
      .limit(1);

    if (existingReceived.length > 0) {
      await db
        .update(projectEquipmentTimesheetReceived)
        .set({
          received: true,
          receivedBy: parseInt(session.user.id),
          receivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(eq(projectEquipmentTimesheetReceived.id, existingReceived[0].id));
    } else {
      await db.insert(projectEquipmentTimesheetReceived).values({
        projectId,
        projectEquipmentId,
        month,
        received: true,
        receivedBy: parseInt(session.user.id),
        receivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      projectEquipmentId,
      month,
      results,
    });
  } catch (error: any) {
    console.error('Error importing project equipment timesheet:', error);
    return NextResponse.json(
      {
        error: 'Failed to import project equipment timesheet',
        details: error.message,
      },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.project.update)(
  importProjectEquipmentTimesheetHandler
);
