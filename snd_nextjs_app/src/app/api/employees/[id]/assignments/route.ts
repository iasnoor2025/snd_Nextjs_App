import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

// Helper function to manage assignment statuses
async function manageAssignmentStatuses(employeeId: number) {
  try {
    // Get all assignments for this employee, ordered by start date and ID
    const allAssignments = await prisma.employeeAssignment.findMany({
      where: { employee_id: employeeId },
      orderBy: [
        { start_date: 'asc' },
        { id: 'asc' }
      ]
    });

    if (allAssignments.length === 0) {
      return;
    }

    // Find the current/latest assignment (the one with the latest start date)
    const currentAssignment = allAssignments.reduce((latest, current) => {
      const latestDate = latest.start_date ? new Date(latest.start_date) : new Date(0);
      const currentDate = current.start_date ? new Date(current.start_date) : new Date(0);
      return currentDate > latestDate ? current : latest;
    });

    // Update all assignments based on their position
    for (let i = 0; i < allAssignments.length; i++) {
      const assignment = allAssignments[i];
      const isCurrent = assignment.id === currentAssignment.id;

      console.log(`\n📝 Processing assignment ${assignment.name} (ID: ${assignment.id}):`);
      console.log(`  Current status: ${assignment.status}`);
      console.log(`  Current end_date: ${assignment.end_date}`);
      console.log(`  Is current assignment: ${isCurrent}`);

      if (isCurrent) {
        // Current assignment should be active and have no end date
        if (assignment.status !== 'active' || assignment.end_date !== null) {
          console.log(`  🔄 Updating current assignment to active with no end date`);
          await prisma.employeeAssignment.update({
            where: { id: assignment.id },
            data: {
              status: 'active',
              end_date: null
            }
          });
        } else {
          console.log(`  ✅ Current assignment already correct`);
        }
      } else {
        // Previous assignments should be completed and have an end date
        // Always update previous assignments to ensure end dates are correct
        // Find the next assignment after this one to set the correct end date
        let nextAssignment = null;
        for (let j = i + 1; j < allAssignments.length; j++) {
          if (allAssignments[j].start_date > assignment.start_date) {
            nextAssignment = allAssignments[j];
            break;
          }
        }

        let endDate;
        if (nextAssignment) {
          // Set end date to the day before the next assignment starts
          endDate = new Date(nextAssignment.start_date);
          endDate.setDate(endDate.getDate() - 1);
          console.log(`  🔄 Updating previous assignment to completed with end date: ${endDate.toISOString().slice(0, 10)} (day before ${nextAssignment.name})`);
        } else {
          // If no next assignment, set to the day before current assignment starts
          endDate = new Date(currentAssignment.start_date);
          endDate.setDate(endDate.getDate() - 1);
          console.log(`  🔄 Updating previous assignment to completed with end date: ${endDate.toISOString().slice(0, 10)} (day before current assignment)`);
        }

        await prisma.employeeAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'completed',
            end_date: endDate
          }
        });
        console.log(`  ✅ Updated previous assignment`);
      }
    }
  } catch (error) {
    console.error('Error managing assignment statuses:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Ensure assignment statuses are properly managed before fetching
    console.log(`🔧 Managing assignment statuses for employee ${employeeId}...`);
    await manageAssignmentStatuses(employeeId);
    console.log(`✅ Assignment statuses managed for employee ${employeeId}`);

    // Get all assignments for the employee with related data
    const assignments = await prisma.employeeAssignment.findMany({
      where: { employee_id: employeeId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        rental: {
          select: {
            id: true,
            rental_number: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Format assignments to match the expected interface
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      name: assignment.name || 'Unnamed Assignment',
      type: assignment.type || 'manual',
      location: assignment.location || '',
      start_date: assignment.start_date.toISOString().slice(0, 10),
      end_date: assignment.end_date?.toISOString().slice(0, 10) || null,
      status: assignment.status || 'active',
      notes: assignment.notes || '',
      project_id: assignment.project_id,
      rental_id: assignment.rental_id,
      project: assignment.project ? {
        id: assignment.project.id,
        name: assignment.project.name,
      } : null,
      rental: assignment.rental ? {
        id: assignment.rental.id,
        rental_number: assignment.rental.rental_number,
        project_name: assignment.rental.customer?.name || 'Unknown Customer',
      } : null,
      created_at: assignment.created_at.toISOString(),
      updated_at: assignment.updated_at.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedAssignments,
      message: 'Assignments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching employee assignments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch employee assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name || !body.start_date) {
      return NextResponse.json(
        { error: "Assignment name and start date are required" },
        { status: 400 }
      );
    }

    // Create assignment in database
    const assignment = await prisma.employeeAssignment.create({
      data: {
        employee_id: employeeId,
        name: body.name,
        type: body.type || 'manual',
        location: body.location,
        start_date: new Date(body.start_date),
        end_date: null, // Always null for new assignments
        status: 'active', // Always active for new assignments
        notes: body.notes,
        project_id: body.project_id || null,
        rental_id: body.rental_id || null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        rental: {
          select: {
            id: true,
            rental_number: true,
          },
        },
      },
    });

    // Manage assignment statuses after creating new assignment
    await manageAssignmentStatuses(employeeId);

    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      assignment,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee assignment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create employee assignment',
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name || !body.start_date) {
      return NextResponse.json(
        { error: "Assignment name and start date are required" },
        { status: 400 }
      );
    }

    // Update assignment in database
    const assignment = await prisma.employeeAssignment.update({
      where: { id: body.id },
      data: {
        name: body.name,
        type: body.type || 'manual',
        location: body.location,
        start_date: new Date(body.start_date),
        end_date: body.end_date ? new Date(body.end_date) : null,
        notes: body.notes,
        project_id: body.project_id || null,
        rental_id: body.rental_id || null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        rental: {
          select: {
            id: true,
            rental_number: true,
          },
        },
      },
    });

    // Manage assignment statuses after updating assignment
    console.log(`🔧 Managing assignment statuses after update for employee ${employeeId}...`);
    await manageAssignmentStatuses(employeeId);
    console.log(`✅ Assignment statuses managed after update for employee ${employeeId}`);

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      data: {
        id: assignment.id,
        name: assignment.name,
        type: assignment.type,
        location: assignment.location,
        start_date: assignment.start_date.toISOString().slice(0, 10),
        end_date: assignment.end_date?.toISOString().slice(0, 10) || null,
        status: assignment.status,
        notes: assignment.notes,
        project_id: assignment.project_id,
        rental_id: assignment.rental_id,
        project: assignment.project,
        rental: assignment.rental ? {
          id: assignment.rental.id,
          rental_number: assignment.rental.rental_number,
          project_name: null, // We'll add this later if needed
        } : null,
        created_at: assignment.created_at.toISOString(),
        updated_at: assignment.updated_at.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error in PUT /api/employees/[id]/assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update assignment: ' + (error as Error).message
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('assignmentId');

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Check if assignment exists and belongs to this employee
    const assignment = await prisma.employeeAssignment.findFirst({
      where: {
        id: parseInt(assignmentId),
        employee_id: employeeId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // If this is a manual assignment that was created from an equipment assignment, also delete the corresponding equipment assignment
    let deletedEquipmentAssignment = null;
    if (assignment.type === 'manual' && assignment.name && assignment.name.includes('Equipment Assignment -')) {
      try {
        // Find and delete the corresponding equipment assignment
        const equipmentAssignment = await prisma.equipmentRentalHistory.findFirst({
          where: {
            employee_id: employeeId,
            assignment_type: 'manual',
            status: 'active'
          }
        });

        if (equipmentAssignment) {
          await prisma.equipmentRentalHistory.delete({
            where: { id: equipmentAssignment.id }
          });
          deletedEquipmentAssignment = equipmentAssignment;
          console.log('Equipment assignment deleted automatically:', equipmentAssignment);
        }
      } catch (assignmentError) {
        console.error('Error deleting equipment assignment:', assignmentError);
        // Don't fail the employee assignment deletion if equipment assignment deletion fails
      }
    }

    // Delete the employee assignment
    await prisma.employeeAssignment.delete({
      where: { id: parseInt(assignmentId) },
    });

    // Manage assignment statuses after deleting assignment
    await manageAssignmentStatuses(employeeId);

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully' + (deletedEquipmentAssignment ? ' and equipment assignment deleted automatically' : ''),
      data: {
        deletedEmployeeAssignment: assignment,
        deletedEquipmentAssignment
      }
    });
  } catch (error) {
    console.error('Error deleting employee assignment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete employee assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


