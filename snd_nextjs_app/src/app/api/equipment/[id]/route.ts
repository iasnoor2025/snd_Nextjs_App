import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { equipment, equipmentRentalHistory, projects, rentals, employees } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    const [equipmentData] = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        modelNumber: equipment.modelNumber,
        status: equipment.status,
        categoryId: equipment.categoryId,
        manufacturer: equipment.manufacturer,
        dailyRate: equipment.dailyRate,
        weeklyRate: equipment.weeklyRate,
        monthlyRate: equipment.monthlyRate,
        erpnextId: equipment.erpnextId,
        serialNumber: equipment.serialNumber,
        description: equipment.description,
        createdAt: equipment.createdAt,
        updatedAt: equipment.updatedAt
      })
      .from(equipment)
      .where(eq(equipment.id, id))
      .limit(1);

    if (!equipmentData) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Get current assignment for this equipment using Drizzle
    const [currentAssignment] = await db
      .select({
        id: equipmentRentalHistory.id,
        assignmentType: equipmentRentalHistory.assignmentType,
        status: equipmentRentalHistory.status,
        project: {
          name: projects.name
        },
        rental: {
          rentalNumber: rentals.rentalNumber
        },
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName
        }
      })
      .from(equipmentRentalHistory)
      .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
      .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
      .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
      .where(and(
        eq(equipmentRentalHistory.equipmentId, id),
        eq(equipmentRentalHistory.status, 'active')
      ))
      .limit(1);
    
    let assignmentName = '';
    if (currentAssignment) {
      if (currentAssignment.assignmentType === 'project' && currentAssignment.project) {
        assignmentName = currentAssignment.project.name;
      } else if (currentAssignment.assignmentType === 'rental' && currentAssignment.rental) {
        assignmentName = `Rental: ${currentAssignment.rental.rentalNumber}`;
      } else if (currentAssignment.assignmentType === 'manual' && currentAssignment.employee) {
        assignmentName = `${currentAssignment.employee.firstName} ${currentAssignment.employee.lastName}`.trim();
      } else {
        assignmentName = currentAssignment.assignmentType;
      }
    }
    
    const equipmentWithAssignment = {
      ...equipmentData,
      current_assignment: currentAssignment ? {
        id: currentAssignment.id,
        type: currentAssignment.assignmentType,
        name: assignmentName,
        status: 'active'
      } : null
    };

    return NextResponse.json({
      success: true,
      data: equipmentWithAssignment
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
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Update equipment
    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        manufacturer: body.manufacturer,
        model_number: body.model_number,
        serial_number: body.serial_number,
        status: body.status,
        daily_rate: body.daily_rate ? parseFloat(body.daily_rate) : null,
        weekly_rate: body.weekly_rate ? parseFloat(body.weekly_rate) : null,
        monthly_rate: body.monthly_rate ? parseFloat(body.monthly_rate) : null,
        updated_at: new Date()
      },
      select: {
        id: true,
        name: true,
        model_number: true,
        status: true,
        category_id: true,
        manufacturer: true,
        daily_rate: true,
        weekly_rate: true,
        monthly_rate: true,
        erpnext_id: true,
        serial_number: true,
        description: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedEquipment
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update equipment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active to false
    await prisma.equipment.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete equipment' },
      { status: 500 }
    );
  }
}
