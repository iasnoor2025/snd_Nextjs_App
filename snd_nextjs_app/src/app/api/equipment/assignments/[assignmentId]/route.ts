import { db } from '@/lib/drizzle';
import {
  customers,
  employeeAssignments,
  employees,
  equipment,
  equipmentRentalHistory,
  projects,
  rentals,
} from '@/lib/drizzle/schema';
import { and, eq, like } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { withPermission } from '@/lib/rbac/api-middleware';
import { PermissionConfigs } from '@/lib/rbac/api-middleware';
import { cacheService } from '@/lib/redis';
import { CACHE_TAGS } from '@/lib/redis';

export const PUT = withPermission(PermissionConfigs.equipment.update)(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ assignmentId: string }> }
  ) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId: assignmentIdParam } = await params;
    const assignmentId = parseInt(assignmentIdParam);

    if (isNaN(assignmentId)) {
      return NextResponse.json({ success: false, error: 'Invalid assignment ID' }, { status: 400 });
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
      status,
    } = body;

    // Check if assignment exists
    const existingAssignment = await db
      .select()
      .from(equipmentRentalHistory)
      .where(eq(equipmentRentalHistory.id, assignmentId))
      .limit(1);

    if (!existingAssignment.length) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    const currentAssignment = existingAssignment[0];
    if (!currentAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment data not found' },
        { status: 404 }
      );
    }

    const previousEmployeeId = currentAssignment.employeeId;
    const previousAssignmentType = currentAssignment.assignmentType;
    const newEmployeeId = employee_id ? parseInt(employee_id) : currentAssignment.employeeId;
    const newAssignmentType = assignment_type || currentAssignment.assignmentType;

    // Prepare update data
    const updateData: any = {};

    if (assignment_type !== undefined) updateData.assignmentType = assignment_type;
    if (project_id !== undefined) updateData.projectId = project_id;
    if (employee_id !== undefined) updateData.employeeId = employee_id;
    if (rental_id !== undefined) updateData.rentalId = rental_id;
    if (start_date !== undefined) updateData.startDate = new Date(start_date);
    if (end_date !== undefined) updateData.endDate = end_date ? new Date(end_date) : null;
    if (daily_rate !== undefined) updateData.dailyRate = daily_rate ? parseFloat(daily_rate) : null;
    if (total_amount !== undefined)
      updateData.totalAmount = total_amount ? parseFloat(total_amount) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    // Update the assignment
    await db
      .update(equipmentRentalHistory)
      .set(updateData)
      .where(eq(equipmentRentalHistory.id, assignmentId));

    // Handle employee assignment synchronization
    let employeeAssignment: any = null;

    // Check if we need to handle employee assignment changes
    const employeeAssignmentChanged =
      previousEmployeeId !== newEmployeeId || previousAssignmentType !== newAssignmentType;

    if (employeeAssignmentChanged) {
      try {
        // If there was a previous manual assignment with an employee, end it
        if (previousAssignmentType === 'manual' && previousEmployeeId) {
          await db
            .update(employeeAssignments)
            .set({
              status: 'inactive',
              endDate: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .where(
              and(
                eq(employeeAssignments.employeeId, previousEmployeeId),
                eq(
                  employeeAssignments.notes,
                  `Manual equipment assignment: ${currentAssignment.notes || 'No additional notes'}`
                ),
                eq(employeeAssignments.status, 'active')
              )
            );

        }

        // If this is now a manual assignment with an employee, create a new employee assignment
        if (newAssignmentType === 'manual' && newEmployeeId) {
          // Get equipment name for the assignment
          const equipmentData = await db
            .select({ name: equipment.name })
            .from(equipment)
            .where(eq(equipment.id, currentAssignment.equipmentId))
            .limit(1);

          const equipmentName = equipmentData[0]?.name || 'Unknown Equipment';

          employeeAssignment = await db
            .insert(employeeAssignments)
            .values({
              employeeId: newEmployeeId,
              name: `Equipment Assignment - ${equipmentName}`,
              type: 'manual',
              location: body.location || null,
              startDate: start_date
                ? new Date(start_date).toISOString()
                : currentAssignment.startDate,
              endDate: end_date ? new Date(end_date).toISOString() : currentAssignment.endDate,
              status: status || currentAssignment.status,
              notes: `Manual equipment assignment: ${notes || currentAssignment.notes || 'No additional notes'}`,
              projectId: null,
              rentalId: null,
              updatedAt: new Date().toISOString(),
            })
            .returning();

        }
      } catch (assignmentError) {
        
        // Don't fail the equipment assignment update if employee assignment sync fails
      }
    }

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
            phone: customers.phone,
          },
        } as any,
        project: {
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
        },
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone,
        },
      })
      .from(equipmentRentalHistory)
      .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
      .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
      .where(eq(equipmentRentalHistory.id, assignmentId))
      .limit(1);

    // Invalidate equipment cache to reflect status changes
    await cacheService.invalidateCacheByTag(CACHE_TAGS.EQUIPMENT);

    return NextResponse.json({
      success: true,
      data: updatedAssignment[0],
      employeeAssignment: employeeAssignment?.[0] || null,
      message:
        'Equipment assignment updated successfully' +
        (employeeAssignment ? ' and employee assignment synced automatically' : ''),
    });
  } catch (error) {
    console.error('Error updating equipment assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update equipment assignment' },
      { status: 500 }
    );
  }
});


export const DELETE = withPermission(PermissionConfigs.equipment.delete)(
  async (request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) => {
  try {
    const resolvedParams = await params;
    const { assignmentId: assignmentIdParam } = resolvedParams;
    const assignmentId = parseInt(assignmentIdParam);

    if (isNaN(assignmentId)) {
      return NextResponse.json({ success: false, error: 'Invalid assignment ID' }, { status: 400 });
    }

    // Check if assignment exists
    const existingAssignment = await db
      .select()
      .from(equipmentRentalHistory)
      .where(eq(equipmentRentalHistory.id, assignmentId))
      .limit(1);

    if (!existingAssignment.length) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    // Delete the equipment assignment
    await db.delete(equipmentRentalHistory).where(eq(equipmentRentalHistory.id, assignmentId));

    // Invalidate equipment cache to reflect status changes
    await cacheService.invalidateCacheByTag(CACHE_TAGS.EQUIPMENT);

    return NextResponse.json({
      success: true,
      message: 'Equipment assignment deleted successfully',
      data: {
        deletedEquipmentAssignment: existingAssignment[0],
      },
    });
  } catch (error) {
    console.error('Error deleting equipment assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete equipment assignment' },
      { status: 500 }
    );
  }
});
