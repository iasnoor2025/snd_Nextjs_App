import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/drizzle';
import {
  projectEquipment,
  projectEquipmentTimesheetReceived,
} from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// PUT /api/projects/[id]/equipment-timesheet-status
// Body: { projectEquipmentId, month, received }
const updateProjectEquipmentTimesheetStatusHandler = async (
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
    const { projectEquipmentId, month, received } = body as {
      projectEquipmentId: number;
      month: string;
      received: boolean;
    };

    if (!projectEquipmentId || !month || typeof received !== 'boolean') {
      return NextResponse.json(
        { error: 'projectEquipmentId, month, and received are required' },
        { status: 400 }
      );
    }

    // Verify project_equipment belongs to this project
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

    const existing = await db
      .select()
      .from(projectEquipmentTimesheetReceived)
      .where(
        and(
          eq(projectEquipmentTimesheetReceived.projectEquipmentId, projectEquipmentId),
          eq(projectEquipmentTimesheetReceived.month, month)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(projectEquipmentTimesheetReceived)
        .set({
          received,
          receivedBy: received ? parseInt(session.user.id) : null,
          receivedAt: received ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(eq(projectEquipmentTimesheetReceived.id, existing[0].id));
    } else {
      await db.insert(projectEquipmentTimesheetReceived).values({
        projectId,
        projectEquipmentId,
        month,
        received,
        receivedBy: received ? parseInt(session.user.id) : null,
        receivedAt: received ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating project equipment timesheet status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update timesheet received status',
        details: error.message,
      },
      { status: 500 }
    );
  }
};

export const PUT = withPermission(PermissionConfigs.project.update)(
  updateProjectEquipmentTimesheetStatusHandler
);
