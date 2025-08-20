import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectEquipment, projects } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; equipmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, equipmentId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!equipmentId || isNaN(parseInt(equipmentId))) {
      return NextResponse.json({ error: 'Invalid equipment ID' }, { status: 400 });
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

    // Verify equipment exists and belongs to the project
    const existingEquipment = await db
      .select()
      .from(projectEquipment)
      .where(
        and(
          eq(projectEquipment.id, parseInt(equipmentId)),
          eq(projectEquipment.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingEquipment.length === 0) {
      return NextResponse.json({ error: 'Equipment resource not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      equipmentId: newEquipmentId,
      operatorId,
      startDate,
      endDate,
      hourlyRate,
      estimatedHours,
      actualHours,
      maintenanceCost,
      fuelConsumption,
      status,
      notes,
    } = body;

    // Update equipment
    const [updatedEquipment] = await db
      .update(projectEquipment)
      .set({
        ...(newEquipmentId !== undefined && { equipmentId: parseInt(newEquipmentId) }),
        ...(operatorId !== undefined && { operatorId: operatorId ? parseInt(operatorId) : null }),
        ...(startDate !== undefined && { startDate: new Date(startDate).toISOString().split('T')[0] }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null }),
        ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate) }),
        ...(estimatedHours !== undefined && { estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null }),
        ...(actualHours !== undefined && { actualHours: actualHours ? parseFloat(actualHours) : null }),
        ...(maintenanceCost !== undefined && { maintenanceCost: maintenanceCost ? parseFloat(maintenanceCost) : null }),
        ...(fuelConsumption !== undefined && { fuelConsumption: fuelConsumption ? parseFloat(fuelConsumption) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(projectEquipment.id, parseInt(equipmentId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedEquipment,
      message: 'Equipment resource updated successfully'
    });
  } catch (error) {
    console.error('Error updating project equipment:', error);
    return NextResponse.json({ error: 'Failed to update project equipment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; equipmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, equipmentId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!equipmentId || isNaN(parseInt(equipmentId))) {
      return NextResponse.json({ error: 'Invalid equipment ID' }, { status: 400 });
    }

    // Verify equipment exists and belongs to the project
    const existingEquipment = await db
      .select()
      .from(projectEquipment)
      .where(
        and(
          eq(projectEquipment.id, parseInt(equipmentId)),
          eq(projectEquipment.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingEquipment.length === 0) {
      return NextResponse.json({ error: 'Equipment resource not found' }, { status: 404 });
    }

    // Delete equipment
    await db
      .delete(projectEquipment)
      .where(eq(projectEquipment.id, parseInt(equipmentId)));

    return NextResponse.json({
      success: true,
      message: 'Equipment resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project equipment:', error);
    return NextResponse.json({ error: 'Failed to delete project equipment' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; equipmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, equipmentId } = await params;

    // Validate IDs
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    if (!equipmentId || isNaN(parseInt(equipmentId))) {
      return NextResponse.json({ error: 'Invalid equipment ID' }, { status: 400 });
    }

    // Get equipment
    const equipment = await db
      .select()
      .from(projectEquipment)
      .where(
        and(
          eq(projectEquipment.id, parseInt(equipmentId)),
          eq(projectEquipment.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (equipment.length === 0) {
      return NextResponse.json({ error: 'Equipment resource not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: equipment[0]
    });
  } catch (error) {
    console.error('Error fetching project equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch project equipment' }, { status: 500 });
  }
}
