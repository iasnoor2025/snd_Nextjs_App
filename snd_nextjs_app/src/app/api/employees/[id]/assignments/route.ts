import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employeeAssignments, projects, rentals } from '@/lib/drizzle/schema';
import { CentralAssignmentService } from '@/lib/services/central-assignment-service';
import { eq, desc, and, ne, lt } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';
import { AssignmentService } from '@/lib/services/assignment-service';

// GET: Fetch assignments for a specific employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Fetch all assignments for this employee with related data
    const assignments = await db
      .select({
        id: employeeAssignments.id,
        name: employeeAssignments.name,
        type: employeeAssignments.type,
        location: employeeAssignments.location,
        start_date: employeeAssignments.startDate,
        end_date: employeeAssignments.endDate,
        status: employeeAssignments.status,
        notes: employeeAssignments.notes,
        project_id: employeeAssignments.projectId,
        rental_id: employeeAssignments.rentalId,
        project: {
          id: projects.id,
          name: projects.name,
        },
        rental: {
          id: rentals.id,
          rental_number: rentals.rentalNumber,
        },
        created_at: employeeAssignments.createdAt,
        updated_at: employeeAssignments.updatedAt,
      })
      .from(employeeAssignments)
      .leftJoin(projects, eq(projects.id, employeeAssignments.projectId))
      .leftJoin(rentals, eq(rentals.id, employeeAssignments.rentalId))
      .where(eq(employeeAssignments.employeeId, employeeId))
      .orderBy(desc(employeeAssignments.startDate));

    return NextResponse.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch assignments',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new assignment for a specific employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      type = 'manual',
      location,
      start_date,
      end_date,
      status = 'active',
      notes,
      project_id,
      rental_id,
    } = body;

    if (!name || !start_date) {
      return NextResponse.json({ 
        error: 'Assignment name and start date are required' 
      }, { status: 400 });
    }

    // Create the assignment using central service (service ensures previous assignment is completed)
    const newAssignment = await CentralAssignmentService.createAssignment({
      type: 'employee',
      entityId: employeeId,
      assignmentType: type,
      startDate: start_date,
      endDate: end_date || undefined,
      status,
      notes: notes || '',
      name: name,
      location: location || '',
      projectId: project_id ? parseInt(project_id) : undefined,
      rentalId: rental_id ? parseInt(rental_id) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      data: newAssignment,
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create assignment',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
