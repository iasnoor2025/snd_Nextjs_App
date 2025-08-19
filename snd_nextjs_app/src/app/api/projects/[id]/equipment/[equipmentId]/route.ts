import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectEquipment, projects, equipment, employees } from '@/lib/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
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
    if (!projectId || !equipmentId || isNaN(parseInt(projectId)) || isNaN(parseInt(equipmentId))) {
      return NextResponse.json({ error: 'Invalid project ID or equipment ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      equipmentId: newEquipmentId,
      operatorId,
      startDate,
      endDate,
      hourlyRate,
      estimatedHours,
      notes,
      status,
    } = body;

    // Validation
    if (!newEquipmentId || !startDate || !hourlyRate) {
      return NextResponse.json({ error: 'Equipment ID, start date, and hourly rate are required' }, { status: 400 });
    }

    // Update equipment assignment
    const [updatedEquipment] = await db
      .update(projectEquipment)
      .set({
        equipmentId: parseInt(newEquipmentId),
        operatorId: operatorId ? parseInt(operatorId) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        hourlyRate: parseFloat(hourlyRate),
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        status: status || 'active',
        notes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectEquipment.id, parseInt(equipmentId)),
          eq(projectEquipment.projectId, parseInt(projectId))
        )
      )
      .returning();

    return NextResponse.json({ 
      success: true,
      data: updatedEquipment,
      message: 'Equipment assignment updated successfully' 
    });
  } catch (error) {
    console.error('Error updating equipment assignment:', error);
    return NextResponse.json({ error: 'Failed to update equipment assignment' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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
    let whereConditions = [eq(projectEquipment.projectId, parseInt(projectId))];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(projectEquipment.status, status));
    }

    // Fetch equipment with related data
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
        equipmentModel: equipment.model,
        operatorName: employees.firstName,
        operatorLastName: employees.lastName,
      })
      .from(projectEquipment)
      .leftJoin(equipment, eq(projectEquipment.equipmentId, equipment.id))
      .leftJoin(employees, eq(projectEquipment.operatorId, employees.id))
      .where(and(...whereConditions))
      .orderBy(desc(projectEquipment.createdAt));

    return NextResponse.json({ 
      success: true,
      data: projectEquipmentList 
    });
  } catch (error) {
    console.error('Error fetching project equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch project equipment' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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

    // Create equipment assignment
    const [newEquipment] = await db
      .insert(projectEquipment)
      .values({
        projectId: parseInt(projectId),
        equipmentId: parseInt(equipmentId),
        operatorId: operatorId ? parseInt(operatorId) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        hourlyRate: parseFloat(hourlyRate),
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        status: 'active',
        notes,
        assignedBy: session.user.id ? parseInt(session.user.id) : null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      data: newEquipment,
      message: 'Equipment assigned successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning equipment:', error);
    return NextResponse.json({ error: 'Failed to assign equipment' }, { status: 500 });
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
    if (!projectId || !equipmentId || isNaN(parseInt(projectId)) || isNaN(parseInt(equipmentId))) {
      return NextResponse.json({ error: 'Invalid project ID or equipment ID' }, { status: 400 });
    }

    // Delete equipment assignment
    await db
      .delete(projectEquipment)
      .where(
        and(
          eq(projectEquipment.id, parseInt(equipmentId)),
          eq(projectEquipment.projectId, parseInt(projectId))
        )
      );

    return NextResponse.json({ 
      success: true,
      message: 'Equipment assignment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting equipment assignment:', error);
    return NextResponse.json({ error: 'Failed to delete equipment assignment' }, { status: 500 });
  }
}
