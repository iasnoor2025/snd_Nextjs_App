import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Manage assignment statuses for an employee
 * - Current assignment (latest start_date) should be 'active' with end_date = null
 * - Previous assignments should be 'completed' with end_date set to day before current starts
 */
async function manageAssignmentStatuses(employeeId: string): Promise<void> {
  console.log('Managing assignment statuses for employee', { employeeId });

  // Get all assignments for this employee, ordered by start date and ID
  const allAssignments = await prisma.employeeAssignment.findMany({
    where: {
      employee_id: parseInt(employeeId),
      status: "active",
    },
    orderBy: [
      { start_date: 'asc' },
      { id: 'asc' },
    ],
  });

  if (allAssignments.length === 0) {
    console.log('No assignments found for employee', { employeeId });
    return;
  }

  // Find the current/latest assignment (the one with the latest start date)
  const currentAssignment = allAssignments.reduce((latest, current) => {
    if (!latest) return current;
    return current.start_date > latest.start_date ? current : latest;
  });

  console.log('Assignment status management', {
    totalAssignments: allAssignments.length,
    currentAssignmentId: currentAssignment?.id,
  });

  // Update all assignments based on their position
  for (const assignment of allAssignments) {
    const isCurrent = assignment.id === currentAssignment.id;

    if (isCurrent) {
      // Current assignment should be active and have no end date
      if (assignment.status !== 'active' || assignment.endDate !== null) {
        console.log('Updating current assignment status', {
          assignmentId: assignment.id,
          oldStatus: assignment.status,
          newStatus: 'active'
        });

        await prisma.employeeAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'active',
            endDate: null
          },
        });
      }
    } else {
      // Previous assignments should be completed and have an end date
      if (assignment.status !== 'completed' || assignment.endDate === null) {
        // Set end date to the day before the current assignment starts
        const endDate = new Date(currentAssignment.start_date);
        endDate.setDate(endDate.getDate() - 1);

        console.log('Updating previous assignment status', {
          assignmentId: assignment.id,
          oldStatus: assignment.status,
          newStatus: 'completed',
          endDate: endDate.toISOString().split('T')[0]
        });

        await prisma.employeeAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'completed',
            endDate: endDate
          },
        });
      }
    }
  }

  console.log('Assignment status management completed', { employeeId });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const { id: employeeId, assignmentId } = await params;
    const body = await request.json();
    const { name, startDate, endDate, location, notes, projectId, rentalId } = body;

    // Check if assignment exists and belongs to this employee
    const existingAssignment = await prisma.employeeAssignment.findFirst({
      where: {
        id: assignmentId,
        employee_id: parseInt(employeeId),
        status: "active",
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Update the assignment
    const updatedAssignment = await prisma.employeeAssignment.update({
      where: { id: assignmentId },
      data: {
        name: name || existingAssignment.name,
        startDate: startDate ? new Date(startDate) : existingAssignment.startDate,
        endDate: null, // Always null for current assignment
        location: location || existingAssignment.location,
        notes: notes || existingAssignment.notes,
        projectId: projectId && projectId !== 'none' ? projectId : null,
        rentalId: rentalId && rentalId !== 'none' ? rentalId : null,
      },
      include: {
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        rental: {
          select: {
            id: true,
            rentalNumber: true,
            status: true,
          },
        },
      },
    });

    // Manage assignment statuses after updating assignment
    await manageAssignmentStatuses(employeeId);

    return NextResponse.json(
      {
        success: true,
        message: 'Assignment updated successfully',
        assignment: updatedAssignment
      }
    );
  } catch (error) {
    console.error('Error updating employee assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const { id: employeeId, assignmentId } = await params;

    // Check if assignment exists and belongs to this employee
    const existingAssignment = await prisma.employeeAssignment.findFirst({
      where: {
        id: assignmentId,
        employee_id: parseInt(employeeId),
        deleted_at: null,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Soft delete the assignment
    await prisma.employeeAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "deleted",
      },
    });

    // Manage assignment statuses after deleting assignment
    await manageAssignmentStatuses(employeeId);

    return NextResponse.json(
      {
        success: true,
        message: 'Assignment deleted successfully'
      }
    );
  } catch (error) {
    console.error('Error deleting employee assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
