import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission, PermissionConfigs, withReadPermission } from '@/lib/rbac/api-middleware';

export const GET = withReadPermission(
  async (request: NextRequest) => {
  try {
    console.log('Fetching equipment from database...');
    
    const equipment = await prisma.equipment.findMany({
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
        description: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Found ${equipment.length} equipment items`);
    
    // Get current assignments for equipment that have them
    const currentAssignments = await prisma.equipmentRentalHistory.findMany({
      where: {
        status: 'active'
      },
      include: {
        project: {
          select: {
            name: true
          }
        },
        rental: {
          select: {
            rental_number: true
          }
        },
        employee: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
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

    const equipment = await prisma.equipment.create({
      data: {
        name: body.name,
        description: body.description,
        category_id: body.categoryId,
        manufacturer: body.manufacturer,
        model_number: body.modelNumber,
        serial_number: body.serialNumber,
        purchase_date: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchase_price: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        status: body.status || 'available',
        daily_rate: body.dailyRate ? parseFloat(body.dailyRate) : null,
        weekly_rate: body.weeklyRate ? parseFloat(body.weeklyRate) : null,
        monthly_rate: body.monthlyRate ? parseFloat(body.monthlyRate) : null,
        is_active: true
      }
    });

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

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name,
        description,
        category_id: categoryId,
        manufacturer,
        model_number: modelNumber,
        serial_number: serialNumber,
        purchase_date: purchaseDate ? new Date(purchaseDate) : null,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        status,
        location_id: locationId,
        notes,
        daily_rate: dailyRate ? parseFloat(dailyRate) : null,
        weekly_rate: weeklyRate ? parseFloat(weeklyRate) : null,
        monthly_rate: monthlyRate ? parseFloat(monthlyRate) : null,
      },
    });

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

    await prisma.equipment.delete({
      where: { id },
    });

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
