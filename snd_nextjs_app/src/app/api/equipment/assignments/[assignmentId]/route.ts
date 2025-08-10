import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { equipmentRentalHistory, rentals, customers, projects, employees, employeeAssignments } from '@/lib/drizzle/schema';
import { eq, and, like, contains } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId: assignmentIdParam } = await params;
    const assignmentId = parseInt(assignmentIdParam);
    
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
    const existingAssignment = await db
      .select()
      .from(equipmentRentalHistory)
      .where(eq(equipmentRentalHistory.id, assignmentId))
      .limit(1);

    if (!existingAssignment.length) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (assignment_type !== undefined) updateData.assignmentType = assignment_type;
    if (project_id !== undefined) updateData.projectId = project_id;
    if (employee_id !== undefined) updateData.employeeId = employee_id;
    if (rental_id !== undefined) updateData.rentalId = rental_id;
    if (start_date !== undefined) updateData.startDate = new Date(start_date);
    if (end_date !== undefined) updateData.endDate = end_date ? new Date(end_date) : null;
    if (daily_rate !== undefined) updateData.dailyRate = daily_rate ? parseFloat(daily_rate) : null;
    if (total_amount !== undefined) updateData.totalAmount = total_amount ? parseFloat(total_amount) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    // Update the assignment
    await db
      .update(equipmentRentalHistory)
      .set(updateData)
      .where(eq(equipmentRentalHistory.id, assignmentId));

    // Fetch the updated assignment with related data
    const updatedAssignment = await db
      .select({
        id: equipmentRentalHistory.id,
        equipmentId: equipmentRentalHistory.equipmentId,
        rentalId: equipmentRentalHistory.rentalId,
        projectId: equipmentRentalHistory.projectId,
        employeeId: equipmentRentalHistory.employeeId,
        assignmentType: equipmentRentalHistory.assignmentType,
        startDate: equipmentRentalHistory.startDate,
        endDate: equipmentRentalHistory.endDate,
        status: equipmentRentalHistory.status,
        notes: equipmentRentalHistory.notes,
        dailyRate: equipmentRentalHistory.dailyRate,
        totalAmount: equipmentRentalHistory.totalAmount,
        createdAt: equipmentRentalHistory.createdAt,
        updatedAt: equipmentRentalHistory.updatedAt,
        rental: {
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
          customer: {
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone
          }
        },
        project: {
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status
        },
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone
        }
      })
      .from(equipmentRentalHistory)
      .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
      .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
      .where(eq(equipmentRentalHistory.id, assignmentId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: updatedAssignment[0],
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
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId: assignmentIdParam } = await params;
    const assignmentId = parseInt(assignmentIdParam);
    
    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = await db
      .select()
      .from(equipmentRentalHistory)
      .where(eq(equipmentRentalHistory.id, assignmentId))
      .limit(1);

    if (!existingAssignment.length) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // If this is a manual assignment with an employee, also delete the corresponding employee assignment
    let deletedEmployeeAssignment = null;
    if (existingAssignment[0].assignmentType === 'manual' && existingAssignment[0].employeeId) {
      try {
        // Find and delete the corresponding employee assignment
        const employeeAssignment = await db
          .select()
          .from(employeeAssignments)
          .where(
            and(
              eq(employeeAssignments.employeeId, existingAssignment[0].employeeId),
              eq(employeeAssignments.type, 'manual'),
              like(employeeAssignments.name, '%Equipment Assignment -%')
            )
          )
          .limit(1);

        if (employeeAssignment.length) {
          await db
            .delete(employeeAssignments)
            .where(eq(employeeAssignments.id, employeeAssignment[0].id));
          deletedEmployeeAssignment = employeeAssignment[0];
          console.log('Employee assignment deleted automatically:', employeeAssignment[0]);
        }
      } catch (assignmentError) {
        console.error('Error deleting employee assignment:', assignmentError);
        // Don't fail the equipment assignment deletion if employee assignment deletion fails
      }
    }

    // Delete the equipment assignment
    await db
      .delete(equipmentRentalHistory)
      .where(eq(equipmentRentalHistory.id, assignmentId));

    return NextResponse.json({
      success: true,
      message: 'Equipment assignment deleted successfully' + (deletedEmployeeAssignment ? ' and employee assignment deleted automatically' : ''),
      data: {
        deletedEquipmentAssignment: existingAssignment[0],
        deletedEmployeeAssignment
      }
    });
  } catch (error) {
    console.error('Error deleting equipment assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete equipment assignment' },
      { status: 500 }
    );
  }
} 