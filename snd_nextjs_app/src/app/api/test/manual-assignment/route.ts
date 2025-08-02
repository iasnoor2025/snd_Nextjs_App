import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      equipment_id,
      employee_id,
      assignment_type = 'manual',
      start_date,
      notes = 'Test manual assignment'
    } = body;

    console.log('Testing manual assignment creation...');
    console.log('Equipment ID:', equipment_id);
    console.log('Employee ID:', employee_id);
    console.log('Assignment Type:', assignment_type);

    // Check if equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(equipment_id) }
    });

    if (!equipment) {
      return NextResponse.json({
        success: false,
        message: 'Equipment not found'
      }, { status: 404 });
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employee_id) }
    });

    if (!employee) {
      return NextResponse.json({
        success: false,
        message: 'Employee not found'
      }, { status: 404 });
    }

    // Create equipment assignment
    const equipmentAssignment = await prisma.equipmentRentalHistory.create({
      data: {
        equipment_id: parseInt(equipment_id),
        employee_id: parseInt(employee_id),
        assignment_type: 'manual',
        start_date: new Date(start_date),
        status: 'active',
        notes: notes
      }
    });

    console.log('Equipment assignment created:', equipmentAssignment);

    // Create employee assignment automatically
    const employeeAssignment = await prisma.employeeAssignment.create({
      data: {
        employee_id: parseInt(employee_id),
        name: `Equipment Assignment - ${equipment.name}`,
        type: 'manual',
        start_date: new Date(start_date),
        status: 'active',
        notes: `Manual equipment assignment: ${notes}`,
        project_id: null,
        rental_id: null
      }
    });

    console.log('Employee assignment created:', employeeAssignment);

    return NextResponse.json({
      success: true,
      data: {
        equipmentAssignment,
        employeeAssignment
      },
      message: 'Manual assignment test completed successfully'
    });

  } catch (error) {
    console.error('Error in manual assignment test:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test manual assignment: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
} 