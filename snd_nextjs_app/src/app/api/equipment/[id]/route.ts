import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    const equipment = await prisma.equipment.findUnique({
      where: { id },
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

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Get current assignment for this equipment
    const currentAssignment = await prisma.equipmentRentalHistory.findFirst({
      where: {
        equipment_id: id,
        status: 'active',
        end_date: null
      },
      select: {
        id: true,
        assignment_type: true,
        project: {
          select: {
            name: true
          }
        },
        rental: {
          select: {
            rental_number: true
          }
        }
      }
    });
    
    const equipmentWithAssignment = {
      ...equipment,
      current_assignment: currentAssignment ? {
        id: currentAssignment.id,
        type: currentAssignment.assignment_type,
        name: currentAssignment.assignment_type === 'project' && currentAssignment.project 
          ? currentAssignment.project.name 
          : currentAssignment.assignment_type === 'rental' && currentAssignment.rental
          ? `Rental: ${currentAssignment.rental.rental_number}`
          : currentAssignment.assignment_type,
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
