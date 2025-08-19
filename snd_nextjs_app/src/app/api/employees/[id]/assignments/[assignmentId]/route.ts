import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import {
  employeeAssignments,
  equipmentRentalHistory,
  projects,
  rentals,
} from '@/lib/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const assignmentId = parseInt(resolvedParams.assignmentId);
    const body = await request.json();

    if (!employeeId || !assignmentId) {
      return NextResponse.json({ error: 'Invalid employee ID or assignment ID' }, { status: 400 });
    }

    // Check if assignment exists and belongs to employee
    const existingAssignmentResult = await db
      .select()
      .from(employeeAssignments)
      .where(
        and(
          eq(employeeAssignments.id, assignmentId),
          eq(employeeAssignments.employeeId, employeeId)
        )
      )
      .limit(1);

    if (!existingAssignmentResult[0]) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Update assignment in database
    const assignmentResult = await db
      .update(employeeAssignments)
      .set({
        name: body.name,
        type: body.type,
        location: body.location,
        startDate: new Date(body.startDate).toISOString(),
        endDate: body.endDate ? new Date(body.endDate).toISOString() : null,
        status: body.status,
        notes: body.notes,
        projectId: body.projectId || null,
        rentalId: body.rentalId || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employeeAssignments.id, assignmentId))
      .returning();

    const assignment = assignmentResult[0];

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Fetch related data
    const projectData = assignment.projectId
      ? await db
          .select({
            id: projects.id,
            name: projects.name,
          })
          .from(projects)
          .where(eq(projects.id, assignment.projectId))
          .limit(1)
      : null;

    const rentalData = assignment.rentalId
      ? await db
          .select({
            id: rentals.id,
            rentalNumber: rentals.rentalNumber,
            project: {
              id: projects.id,
              name: projects.name,
            },
          })
          .from(rentals)
          .leftJoin(projects, eq(rentals.projectId, projects.id))
          .where(eq(rentals.id, assignment.rentalId))
          .limit(1)
      : null;

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      data: {
        id: assignment.id,
        name: assignment.name,
        type: assignment.type,
        location: assignment.location,
        startDate:
          typeof assignment.startDate === 'string'
            ? assignment.startDate.slice(0, 10)
            : new Date(assignment.startDate).toISOString().slice(0, 10),
        endDate: assignment.endDate
          ? typeof assignment.endDate === 'string'
            ? assignment.endDate.slice(0, 10)
            : new Date(assignment.endDate).toISOString().slice(0, 10)
          : null,
        status: assignment.status,
        notes: assignment.notes,
        projectId: assignment.projectId,
        rentalId: assignment.rentalId,
        project: projectData?.[0] || null,
        rental: rentalData?.[0] || null,
        createdAt:
          typeof assignment.createdAt === 'string'
            ? assignment.createdAt
            : new Date(assignment.createdAt).toISOString(),
        updatedAt:
          typeof assignment.updatedAt === 'string'
            ? assignment.updatedAt
            : new Date(assignment.updatedAt).toISOString(),
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update assignment: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const assignmentId = parseInt(resolvedParams.assignmentId);

    if (!employeeId || !assignmentId) {
      return NextResponse.json({ error: 'Invalid employee ID or assignment ID' }, { status: 400 });
    }

    // Check if assignment exists and belongs to employee
    const assignmentResult = await db
      .select()
      .from(employeeAssignments)
      .where(
        and(
          eq(employeeAssignments.id, assignmentId),
          eq(employeeAssignments.employeeId, employeeId)
        )
      )
      .limit(1);

    if (!assignmentResult[0]) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignmentResult[0];

    // If this is a manual assignment that was created from an equipment assignment, also delete the corresponding equipment assignment
    let deletedEquipmentAssignment: any = null;
    if (
      assignment.type === 'manual' &&
      assignment.name &&
      assignment.name.includes('Equipment Assignment -')
    ) {
      try {
        // Find and delete the corresponding equipment assignment
        const equipmentAssignmentResult = await db
          .select()
          .from(equipmentRentalHistory)
          .where(
            and(
              eq(equipmentRentalHistory.employeeId, employeeId),
              eq(equipmentRentalHistory.assignmentType, 'manual'),
              eq(equipmentRentalHistory.status, 'active')
            )
          )
          .limit(1);

        if (equipmentAssignmentResult[0]) {
          const equipmentAssignment = equipmentAssignmentResult[0];
          await db
            .delete(equipmentRentalHistory)
            .where(eq(equipmentRentalHistory.id, equipmentAssignment.id));
          deletedEquipmentAssignment = equipmentAssignment;
          
        }
      } catch (assignmentError) {
        
        // Don't fail the employee assignment deletion if equipment assignment deletion fails
      }
    }

    // Delete assignment from database
    await db.delete(employeeAssignments).where(eq(employeeAssignments.id, assignmentId));

    return NextResponse.json({
      success: true,
      message:
        'Assignment deleted successfully' +
        (deletedEquipmentAssignment ? ' and equipment assignment deleted automatically' : ''),
      data: {
        deletedEmployeeAssignment: assignment,
        deletedEquipmentAssignment,
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete assignment: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
