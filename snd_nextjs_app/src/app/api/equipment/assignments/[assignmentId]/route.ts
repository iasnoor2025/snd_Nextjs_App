import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const assignmentId = parseInt(params.assignmentId);
    
    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      assignment_type,
      project_id,
      employee_id,
      rental_id,
      start_date,
      end_date,
      daily_rate,
      total_amount,
      notes,
      status
    } = body;

    // Check if assignment exists
    const existingAssignment = await prisma.equipmentRentalHistory.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (assignment_type !== undefined) updateData.assignment_type = assignment_type;
    if (project_id !== undefined) updateData.project_id = project_id;
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (rental_id !== undefined) updateData.rental_id = rental_id;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = end_date ? new Date(end_date) : null;
    if (daily_rate !== undefined) updateData.daily_rate = daily_rate ? parseFloat(daily_rate) : null;
    if (total_amount !== undefined) updateData.total_amount = total_amount ? parseFloat(total_amount) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    // Update the assignment
    const updatedAssignment = await prisma.equipmentRentalHistory.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        rental: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true
          }
        },
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: 'Equipment assignment updated successfully'
    });
  } catch (error) {
    console.error('Error updating equipment assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update equipment assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const assignmentId = parseInt(params.assignmentId);
    
    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = await prisma.equipmentRentalHistory.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Delete the assignment
    await prisma.equipmentRentalHistory.delete({
      where: { id: assignmentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Equipment assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting equipment assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete equipment assignment' },
      { status: 500 }
    );
  }
} 