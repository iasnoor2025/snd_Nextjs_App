import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectEquipment, projects, equipment, projectManpower, employees } from '@/lib/drizzle/schema';
import { CentralAssignmentService } from '@/lib/services/central-assignment-service';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

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
        // Operator info now comes from projectManpower with proper JOIN to employees
        // Handle both employee-based and worker-based manpower records using SQL CASE
        operatorName: sql`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.firstName} ELSE NULL END`,
        operatorLastName: sql`CASE WHEN ${projectManpower.employeeId} IS NOT NULL THEN ${employees.lastName} ELSE NULL END`,
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

    // Calculate total cost for each equipment item
    const equipmentWithCosts = projectEquipmentList.map(item => ({
      ...item,
      total_cost: (Number(item.hourlyRate) || 0) * (Number(item.estimatedHours) || 0) + (Number(item.maintenanceCost) || 0),
      type: 'equipment' // Add type for frontend categorization
    }));

    return NextResponse.json({ 
      success: true,
      data: equipmentWithCosts 
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
