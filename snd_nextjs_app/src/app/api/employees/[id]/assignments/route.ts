import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import {
  employeeAssignments,
  employees as employeesTable,
  equipmentRentalHistory,
  projects,
  rentals,
} from '@/lib/drizzle/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to manage assignment statuses
async function manageAssignmentStatuses(employeeId: number) {
  try {
    // Get all assignments for this employee, ordered by start date and ID
    const allAssignmentsRows = await db
      .select({
        id: employeeAssignments.id,
        startDate: employeeAssignments.startDate,
        status: employeeAssignments.status,
        endDate: employeeAssignments.endDate,
        name: employeeAssignments.name,
      })
      .from(employeeAssignments)
      .where(eq(employeeAssignments.employeeId, employeeId))
      .orderBy(asc(employeeAssignments.startDate), asc(employeeAssignments.id));

    if (allAssignmentsRows.length === 0) {
      return;
    }

    // Find the current/latest assignment (the one with the latest start date)
    const currentAssignment = allAssignmentsRows.reduce((latest, current) => {
      const latestDate = latest.startDate ? new Date(latest.startDate) : new Date(0);
      const currentDate = current.startDate ? new Date(current.startDate) : new Date(0);
      return currentDate > latestDate ? current : latest;
    });

    // Update all assignments based on their position
    for (let i = 0; i < allAssignmentsRows.length; i++) {
      const assignment = allAssignmentsRows[i];

      if (!assignment) continue;

      const isCurrent = assignment.id === currentAssignment?.id;



      if (isCurrent) {
        // Current assignment should be active and have no end date
        if (assignment.status !== 'active' || assignment.endDate !== null) {
          
          await db
            .update(employeeAssignments)
            .set({
              status: 'active',
              endDate: null,
            })
            .where(eq(employeeAssignments.id, assignment.id));
        } else {
          
        }
      } else {
        // Previous assignments should be completed and have an end date
        // Always update previous assignments to ensure end dates are correct
        // Find the next assignment after this one to set the correct end date
        let nextAssignment: any = null;
        for (let j = i + 1; j < allAssignmentsRows.length; j++) {
          const nextAssignmentCandidate = allAssignmentsRows[j];
          if (nextAssignmentCandidate && nextAssignmentCandidate.startDate > assignment.startDate) {
            nextAssignment = nextAssignmentCandidate;
            break;
          }
        }

        let endDate;
        if (nextAssignment) {
          // Set end date to the day before the next assignment starts
          endDate = new Date(nextAssignment.startDate);
          endDate.setDate(endDate.getDate() - 1);
          // End date set correctly before next assignment
        } else {
          // If no next assignment, set to the day before current assignment starts
          endDate = new Date(currentAssignment.startDate);
          endDate.setDate(endDate.getDate() - 1);
          // End date set to day before current assignment
        }

        await db
          .update(employeeAssignments)
          .set({
            status: 'completed',
            endDate: endDate.toISOString(),
          })
          .where(eq(employeeAssignments.id, assignment.id));
        
      }
    }
  } catch (error) {
    
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = resolvedParams;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Check if employee exists
    const employeeRows = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (employeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Ensure assignment statuses are properly managed before fetching
    
    await manageAssignmentStatuses(employeeId);

    // Get all assignments for the employee with related data using Drizzle
    const assignmentsRows = await db
      .select({
        id: employeeAssignments.id,
        name: employeeAssignments.name,
        type: employeeAssignments.type,
        location: employeeAssignments.location,
        startDate: employeeAssignments.startDate,
        endDate: employeeAssignments.endDate,
        status: employeeAssignments.status,
        notes: employeeAssignments.notes,
        projectId: employeeAssignments.projectId,
        rentalId: employeeAssignments.rentalId,
        createdAt: employeeAssignments.createdAt,
        updatedAt: employeeAssignments.updatedAt,
        projectId_rel: projects.id,
        projectName: projects.name,
        rentalId_rel: rentals.id,
        rentalNumber: rentals.rentalNumber,
        customerName: rentals.customerId, // We'll need to join with customers table for this
      })
      .from(employeeAssignments)
      .leftJoin(projects, eq(projects.id, employeeAssignments.projectId))
      .leftJoin(rentals, eq(rentals.id, employeeAssignments.rentalId))
      .where(eq(employeeAssignments.employeeId, employeeId))
      .orderBy(desc(employeeAssignments.createdAt));

    // Format assignments to match the expected interface
    const formattedAssignments = assignmentsRows.map(assignment => ({
      id: assignment.id,
      name: assignment.name || 'Unnamed Assignment',
      type: assignment.type || 'manual',
      location: assignment.location || '',
      start_date: assignment.startDate.slice(0, 10),
      end_date: assignment.endDate ? assignment.endDate.slice(0, 10) : null,
      status: assignment.status || 'active',
      notes: assignment.notes || '',
      project_id: assignment.projectId,
      rental_id: assignment.rentalId,
      project: assignment.projectId_rel
        ? {
            id: assignment.projectId_rel,
            name: assignment.projectName || 'Unknown Project',
          }
        : null,
      rental: assignment.rentalId_rel
        ? {
            id: assignment.rentalId_rel,
            rental_number: assignment.rentalNumber || 'Unknown Rental',
            project_name: 'Unknown Customer', // We'll need to join with customers for this
          }
        : null,
      created_at: assignment.createdAt,
      updated_at: assignment.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedAssignments,
      message: 'Assignments retrieved successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to fetch employee assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = resolvedParams;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Check if employee exists
    const employeeRows = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (employeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Validate required fields
    if (!body.name || !body.start_date) {
      return NextResponse.json(
        { error: 'Assignment name and start date are required' },
        { status: 400 }
      );
    }

    // Create assignment in database using Drizzle
    const assignmentRows = await db
      .insert(employeeAssignments)
      .values({
        employeeId: employeeId,
        name: body.name,
        type: body.type || 'manual',
        location: body.location,
        startDate: body.start_date,
        endDate: null, // Always null for new assignments
        status: 'active', // Always active for new assignments
        notes: body.notes,
        projectId: body.project_id || null,
        rentalId: body.rental_id || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const assignment = assignmentRows[0];

    // Manage assignment statuses after creating new assignment
    await manageAssignmentStatuses(employeeId);

    return NextResponse.json(
      {
        success: true,
        message: 'Assignment created successfully',
        assignment,
      },
      { status: 201 }
    );
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to create employee assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = resolvedParams;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Check if employee exists
    const employeeRows = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (employeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Validate required fields
    if (!body.name || !body.start_date) {
      return NextResponse.json(
        { error: 'Assignment name and start date are required' },
        { status: 400 }
      );
    }

    // Update assignment in database using Drizzle
    const assignmentRows = await db
      .update(employeeAssignments)
      .set({
        name: body.name,
        type: body.type || 'manual',
        location: body.location,
        startDate: body.start_date,
        endDate: body.end_date || null,
        notes: body.notes,
        projectId: body.project_id || null,
        rentalId: body.rental_id || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employeeAssignments.id, body.id))
      .returning();

    const assignment = assignmentRows[0];

    // Manage assignment statuses after updating assignment
    
    await manageAssignmentStatuses(employeeId);

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      data: {
        id: assignment?.id,
        name: assignment?.name,
        type: assignment?.type,
        location: assignment?.location,
        start_date: assignment?.startDate?.slice(0, 10),
        end_date: assignment?.endDate ? assignment.endDate.slice(0, 10) : null,
        status: assignment?.status,
        notes: assignment?.notes,
        project_id: assignment?.projectId,
        rental_id: assignment?.rentalId,
        project: null, // We'll need to fetch this separately if needed
        rental: null, // We'll need to fetch this separately if needed
        created_at: assignment?.createdAt,
        updated_at: assignment?.updatedAt,
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = resolvedParams;
    const employeeId = parseInt(id);
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('assignmentId');

    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Check if employee exists
    const employeeRows = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (employeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if assignment exists and belongs to this employee
    const assignmentRows = await db
      .select({
        id: employeeAssignments.id,
        type: employeeAssignments.type,
        name: employeeAssignments.name,
      })
      .from(employeeAssignments)
      .where(
        and(
          eq(employeeAssignments.id, parseInt(assignmentId)),
          eq(employeeAssignments.employeeId, employeeId)
        )
      )
      .limit(1);

    if (assignmentRows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = assignmentRows[0];

    // If this is a manual assignment that was created from an equipment assignment, also delete the corresponding equipment assignment
    let deletedEquipmentAssignment: any = null;
    if (
      assignment?.type === 'manual' &&
      assignment?.name &&
      assignment.name.includes('Equipment Assignment -')
    ) {
      try {
        // Find and delete the corresponding equipment assignment
        const equipmentAssignmentRows = await db
          .select({
            id: equipmentRentalHistory.id,
          })
          .from(equipmentRentalHistory)
          .where(
            and(
              eq(equipmentRentalHistory.employeeId, employeeId),
              eq(equipmentRentalHistory.assignmentType, 'manual'),
              eq(equipmentRentalHistory.status, 'active')
            )
          )
          .limit(1);

        if (equipmentAssignmentRows.length > 0) {
          const equipmentAssignment = equipmentAssignmentRows[0];

          if (equipmentAssignment && equipmentAssignment.id) {
            await db
              .delete(equipmentRentalHistory)
              .where(eq(equipmentRentalHistory.id, equipmentAssignment.id));
            deletedEquipmentAssignment = equipmentAssignment;
            
          }
        }
      } catch (assignmentError) {
        
        // Don't fail the employee assignment deletion if equipment assignment deletion fails
      }
    }

    // Delete the employee assignment
    await db.delete(employeeAssignments).where(eq(employeeAssignments.id, parseInt(assignmentId)));

    // Manage assignment statuses after deleting assignment
    await manageAssignmentStatuses(employeeId);

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
        error: 'Failed to delete employee assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
