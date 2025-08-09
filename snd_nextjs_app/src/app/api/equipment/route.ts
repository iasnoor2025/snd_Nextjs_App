import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withPermission, PermissionConfigs, withReadPermission } from '@/lib/rbac/api-middleware';
import { equipment as equipmentTable } from '@/lib/drizzle/schema';
import { asc, desc, eq } from 'drizzle-orm';

export const GET = withReadPermission(
  async (request: NextRequest) => {
  try {
    console.log('Fetching equipment from database...');
    
    const equipment = await db
      .select({
        id: equipmentTable.id,
        name: equipmentTable.name,
        model_number: equipmentTable.modelNumber,
        status: equipmentTable.status,
        category_id: equipmentTable.categoryId,
        manufacturer: equipmentTable.manufacturer,
        daily_rate: equipmentTable.dailyRate,
        weekly_rate: equipmentTable.weeklyRate,
        monthly_rate: equipmentTable.monthlyRate,
        erpnext_id: equipmentTable.erpnextId,
        serial_number: equipmentTable.serialNumber,
        description: equipmentTable.description,
      })
      .from(equipmentTable)
      .orderBy(asc(equipmentTable.name));
    
    console.log(`Found ${equipment.length} equipment items`);
    
    // Get current assignments for equipment that have them
    // Skipping live joins for now; show no current_assignment or provide separate endpoint if needed
    const currentAssignments: any[] = [];
    
    // Create a map of equipment_id to assignment info
    const assignmentMap = new Map();
    currentAssignments.forEach(assignment => {
      assignmentMap.set(assignment.equipment_id, assignment);
    });
    
    // Add assignment info to equipment
    const equipmentWithAssignments = equipment.map(item => {
      const assignment = assignmentMap.get(item.id);
      
      let assignmentName = '';
      if (assignment) {
        if (assignment.assignment_type === 'project' && assignment.project) {
          assignmentName = assignment.project.name;
        } else if (assignment.assignment_type === 'rental' && assignment.rental) {
          assignmentName = `Rental: ${assignment.rental.rental_number}`;
        } else if (assignment.assignment_type === 'manual' && assignment.employee) {
          assignmentName = `${assignment.employee.first_name} ${assignment.employee.last_name}`.trim();
        } else {
          assignmentName = assignment.assignment_type;
        }
      }
      
      return {
        ...item,
        current_assignment: assignment ? {
          id: assignment.id,
          type: assignment.assignment_type,
          name: assignmentName,
          status: 'active'
        } : null
      };
    });

    return NextResponse.json({ 
      success: true,
      data: equipmentWithAssignments,
      source: 'local',
      count: equipmentWithAssignments.length
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch equipment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.equipment.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
  try {
    const body = await request.json();

    const inserted = await db
      .insert(equipmentTable)
      .values({
        name: body.name,
        description: body.description ?? null,
        categoryId: body.categoryId ?? null,
        manufacturer: body.manufacturer ?? null,
        modelNumber: body.modelNumber ?? null,
        serialNumber: body.serialNumber ?? null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate).toISOString() : null,
        purchasePrice: body.purchasePrice ? String(parseFloat(body.purchasePrice)) : null,
        status: body.status || 'available',
        dailyRate: body.dailyRate ? String(parseFloat(body.dailyRate)) : null,
        weeklyRate: body.weeklyRate ? String(parseFloat(body.weeklyRate)) : null,
        monthlyRate: body.monthlyRate ? String(parseFloat(body.monthlyRate)) : null,
        isActive: true as any,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    const equipment = inserted[0];

    return NextResponse.json({ success: true, data: equipment }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create equipment' 
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.equipment.create
);

export const PUT = withPermission(
  async (request: NextRequest) => {
    try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      categoryId,
      manufacturer,
      modelNumber,
      serialNumber,
      purchaseDate,
      purchasePrice,
      status,
      locationId,
      notes,
      dailyRate,
      weeklyRate,
      monthlyRate,
    } = body;

    const updated = await db
      .update(equipmentTable)
      .set({
        name,
        description: description ?? null,
        categoryId,
        manufacturer,
        modelNumber,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        purchasePrice: purchasePrice ? String(parseFloat(purchasePrice)) : null,
        status,
        locationId,
        notes,
        dailyRate: dailyRate ? String(parseFloat(dailyRate)) : null,
        weeklyRate: weeklyRate ? String(parseFloat(weeklyRate)) : null,
        monthlyRate: monthlyRate ? String(parseFloat(monthlyRate)) : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(equipmentTable.id, id))
      .returning();
    const equipment = updated[0];

        return NextResponse.json({ success: true, data: equipment });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update equipment' 
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.equipment.update
);

export const DELETE = withPermission(
  async (request: NextRequest) => {
    try {
    const body = await request.json();
    const { id } = body;

    await db.delete(equipmentTable).where(eq(equipmentTable.id, id));

    return NextResponse.json({ success: true, message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete equipment' 
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.equipment.delete
);
