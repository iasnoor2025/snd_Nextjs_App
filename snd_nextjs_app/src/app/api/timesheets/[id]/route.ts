import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { timesheets, employees, users, projects, rentals, employeeAssignments } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('PUT /api/timesheets/[id] - Updating timesheet:', { id });
    
    // Validate ID parameter
    const timesheetId = parseInt(id);
    if (isNaN(timesheetId)) {
      return NextResponse.json(
        { error: 'Invalid timesheet ID' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('PUT /api/timesheets/[id] - Request body:', body);
    
    const {
      hoursWorked,
      overtimeHours,
      status,
      description,
      tasksCompleted,
      projectId,
      rentalId,
      assignmentId,
      date,
      startTime,
      endTime,
      notes,
    } = body;

    // Validate required fields
    if (hoursWorked === undefined || overtimeHours === undefined) {
      return NextResponse.json(
        { error: 'Hours worked and overtime hours are required' },
        { status: 400 }
      );
    }

    // Check if timesheet exists first
    const [existingTimesheet] = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);
        
    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }

    console.log('PUT /api/timesheets/[id] - Found existing timesheet:', existingTimesheet);

    // Prepare update data with proper type handling
    const updateData: any = {
      hoursWorked: (parseFloat(hoursWorked) || 0).toString(),
      overtimeHours: (parseFloat(overtimeHours) || 0).toString(),
      updatedAt: new Date().toISOString(),
    };

    // Only update fields that are provided and valid
    if (status) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (tasksCompleted !== undefined) updateData.tasks = tasksCompleted;
    if (notes !== undefined) updateData.notes = notes;
    
    // Handle date fields with proper validation
    if (date) {
      try {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          updateData.date = parsedDate.toISOString();
        }
      } catch (e) {
        console.warn('Invalid date provided:', date);
      }
    }

    if (startTime) {
      try {
        const parsedStartTime = new Date(startTime);
        if (!isNaN(parsedStartTime.getTime())) {
          updateData.startTime = parsedStartTime.toISOString();
        }
      } catch (e) {
        console.warn('Invalid startTime provided:', startTime);
      }
    }

    if (endTime) {
      try {
        const parsedEndTime = new Date(endTime);
        if (!isNaN(parsedEndTime.getTime())) {
          updateData.endTime = parsedEndTime.toISOString();
        }
      } catch (e) {
        console.warn('Invalid endTime provided:', endTime);
      }
    }

    // Handle ID fields with proper validation
    if (projectId !== undefined) {
      updateData.projectId = projectId ? parseInt(projectId) : null;
    }
    if (rentalId !== undefined) {
      updateData.rentalId = rentalId ? parseInt(rentalId) : null;
    }
    if (assignmentId !== undefined) {
      updateData.assignmentId = assignmentId ? parseInt(assignmentId) : null;
    }

    // Ensure startTime is always set (required field)
    if (!updateData.startTime && !existingTimesheet.startTime) {
      updateData.startTime = new Date().toISOString();
    }
    
    console.log('PUT /api/timesheets/[id] - Updating with data:', updateData);
    
    // Update the timesheet
    const [updatedTimesheet] = await db
      .update(timesheets)
      .set(updateData)
      .where(eq(timesheets.id, timesheetId))
      .returning();
        
    if (!updatedTimesheet) {
      throw new Error('No timesheet was updated');
    }

    console.log('PUT /api/timesheets/[id] - Update successful:', updatedTimesheet);

    // Fetch the updated timesheet with related data
    const [timesheetWithDetails] = await db
      .select({
        id: timesheets.id,
        employeeId: timesheets.employeeId,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        startTime: timesheets.startTime,
        endTime: timesheets.endTime,
        status: timesheets.status,
        projectId: timesheets.projectId,
        rentalId: timesheets.rentalId,
        assignmentId: timesheets.assignmentId,
        description: timesheets.description,
        tasks: timesheets.tasks,
        notes: timesheets.notes,
        submittedAt: timesheets.submittedAt,
        approvedBy: timesheets.approvedBy,
        approvedAt: timesheets.approvedAt,
        createdAt: timesheets.createdAt,
        updatedAt: timesheets.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          userId: employees.userId,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
        rental: {
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
        },
        assignment: {
          id: employeeAssignments.id,
          assignmentType: employeeAssignments.assignmentType,
        },
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(projects, eq(timesheets.projectId, projects.id))
      .leftJoin(rentals, eq(timesheets.rentalId, rentals.id))
      .leftJoin(employeeAssignments, eq(timesheets.assignmentId, employeeAssignments.id))
      .where(eq(timesheets.id, timesheetId))
      .limit(1);
        
    if (!timesheetWithDetails) {
      throw new Error('Failed to fetch updated timesheet details');
    }

    // Transform the response to match frontend interface
    const transformedTimesheet = {
      id: timesheetWithDetails.id.toString(),
      employeeId: timesheetWithDetails.employeeId.toString(),
      date: String(timesheetWithDetails.date).split('T')[0],
      hoursWorked: timesheetWithDetails.hoursWorked,
      overtimeHours: timesheetWithDetails.overtimeHours,
      startTime: timesheetWithDetails.startTime ? String(timesheetWithDetails.startTime) : '',
      endTime: timesheetWithDetails.endTime ? String(timesheetWithDetails.endTime) : '',
      status: timesheetWithDetails.status,
      projectId: timesheetWithDetails.projectId?.toString(),
      rentalId: timesheetWithDetails.rentalId?.toString(),
      assignmentId: timesheetWithDetails.assignmentId?.toString(),
      description: timesheetWithDetails.description || '',
      tasksCompleted: timesheetWithDetails.tasks || '',
      notes: timesheetWithDetails.notes || '',
      submittedAt: timesheetWithDetails.submittedAt ? String(timesheetWithDetails.submittedAt) : '',
      approvedBy: timesheetWithDetails.user?.name || '',
      approvedAt: timesheetWithDetails.approvedAt ? String(timesheetWithDetails.approvedAt) : '',
      createdAt: String(timesheetWithDetails.createdAt),
      updatedAt: String(timesheetWithDetails.updatedAt),
      employee: {
        id: timesheetWithDetails.employee?.id.toString() || '',
        firstName: timesheetWithDetails.employee?.firstName || '',
        lastName: timesheetWithDetails.employee?.lastName || '',
        employeeId: timesheetWithDetails.employee?.fileNumber || '',
        user: timesheetWithDetails.user ? {
          name: timesheetWithDetails.user.name,
          email: timesheetWithDetails.user.email,
        } : undefined,
      },
      project: timesheetWithDetails.project ? {
        id: timesheetWithDetails.project.id.toString(),
        name: timesheetWithDetails.project.name,
      } : undefined,
      rental: timesheetWithDetails.rental ? {
        id: timesheetWithDetails.rental.id.toString(),
        rentalNumber: timesheetWithDetails.rental.rentalNumber,
      } : undefined,
      assignment: timesheetWithDetails.assignment ? {
        id: timesheetWithDetails.assignment.id.toString(),
        name: timesheetWithDetails.assignment.assignmentType || '',
        type: timesheetWithDetails.assignment.assignmentType,
      } : undefined,
    };

    return NextResponse.json({ timesheet: transformedTimesheet });
  } catch (error) {
    console.error('PUT /api/timesheets/[id] - Error updating timesheet:', error);
    
    return NextResponse.json(
      { error: 'Failed to update timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('GET /api/timesheets/[id] - Fetching timesheet:', { id });
    
    // Validate ID parameter
    const timesheetId = parseInt(id);
    if (isNaN(timesheetId)) {
      return NextResponse.json(
        { error: 'Invalid timesheet ID' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('GET /api/timesheets/[id] - Fetching timesheet with ID:', timesheetId);
    
    // Check database connection
    if (!db) {
      console.error('GET /api/timesheets/[id] - Database connection not available');
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    // Test database connection
    try {
      await db.execute(sql`SELECT 1`);
      console.log('GET /api/timesheets/[id] - Database connection test successful');
    } catch (dbTestError) {
      console.error('GET /api/timesheets/[id] - Database connection test failed:', dbTestError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbTestError instanceof Error ? dbTestError.message : 'Unknown database error' },
        { status: 500 }
      );
    }
    
    // Fetch timesheet with related data
    const [timesheet] = await db
      .select({
        id: timesheets.id,
        employeeId: timesheets.employeeId,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        startTime: timesheets.startTime,
        endTime: timesheets.endTime,
        status: timesheets.status,
        projectId: timesheets.projectId,
        rentalId: timesheets.rentalId,
        assignmentId: timesheets.assignmentId,
        description: timesheets.description,
        tasks: timesheets.tasks,
        notes: timesheets.notes,
        submittedAt: timesheets.submittedAt,
        approvedBy: timesheets.approvedBy,
        approvedAt: timesheets.approvedAt,
        createdAt: timesheets.createdAt,
        updatedAt: timesheets.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          userId: employees.userId,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
        rental: {
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
        },
        assignment: {
          id: employeeAssignments.id,
          assignmentType: employeeAssignments.assignmentType,
        },
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(projects, eq(timesheets.projectId, projects.id))
      .leftJoin(rentals, eq(timesheets.rentalId, rentals.id))
      .leftJoin(employeeAssignments, eq(timesheets.assignmentId, employeeAssignments.id))
      .where(eq(timesheets.id, timesheetId))
      .limit(1);
        
    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    console.log('GET /api/timesheets/[id] - Database query completed');

    // Transform the response to match frontend interface
    const transformedTimesheet = {
      id: timesheet.id.toString(),
      employeeId: timesheet.employeeId.toString(),
      date: String(timesheet.date).split('T')[0],
      hoursWorked: timesheet.hoursWorked,
      overtimeHours: timesheet.overtimeHours,
      startTime: timesheet.startTime ? String(timesheet.startTime) : '',
      endTime: timesheet.endTime ? String(timesheet.endTime) : '',
      status: timesheet.status,
      projectId: timesheet.projectId?.toString(),
      rentalId: timesheet.rentalId?.toString(),
      assignmentId: timesheet.assignmentId?.toString(),
      description: timesheet.description || '',
      tasksCompleted: timesheet.tasks || '',
      notes: timesheet.notes || '',
      submittedAt: timesheet.submittedAt ? String(timesheet.submittedAt) : '',
      approvedBy: timesheet.user?.name || '',
      approvedAt: timesheet.approvedAt ? String(timesheet.approvedAt) : '',
      createdAt: String(timesheet.createdAt),
      updatedAt: String(timesheet.updatedAt),
      employee: {
        id: timesheet.employee?.id.toString() || '', 
        firstName: timesheet.employee?.firstName || '',
        lastName: timesheet.employee?.lastName || '',
        employeeId: timesheet.employee?.fileNumber || '',
        user: timesheet.user ? {
          name: timesheet.user.name,
          email: timesheet.user.email,
        } : undefined,
      },
      project: timesheet.project ? {
        id: timesheet.project.id.toString(),
        name: timesheet.project.name,
      } : undefined,
      rental: timesheet.rental ? {
        id: timesheet.rental.id.toString(),
        rentalNumber: timesheet.rental.rentalNumber,
      } : undefined,
      assignment: timesheet.assignment ? {
        id: timesheet.assignment.id.toString(),
        name: timesheet.assignment.assignmentType || '',
        type: timesheet.assignment.assignmentType,
      } : undefined,
    };

    console.log('GET /api/timesheets/[id] - Returning transformed timesheet');
    return NextResponse.json({ timesheet: transformedTimesheet });
  } catch (error) {
    console.error('GET /api/timesheets/[id] - Error fetching timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if timesheet exists
    const [existingTimesheet] = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, parseInt(id)))
      .limit(1);

    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }

    // Check user role from session
    const userRole = session.user.role || 'USER';

    // Only admin can delete non-draft timesheets
    if (existingTimesheet.status !== 'draft' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only draft timesheets can be deleted by non-admin users' },
        { status: 400 }
      );
    }

    // Delete the timesheet
    await db
      .delete(timesheets)
      .where(eq(timesheets.id, parseInt(id)));

    return NextResponse.json(
      { message: 'Timesheet deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/timesheets/[id] - Error deleting timesheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
