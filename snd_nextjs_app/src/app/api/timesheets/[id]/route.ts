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
          assignmentType: employeeAssignments.type,
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('GET /api/timesheets/[id] - Fetching timesheet:', { id });
    
    // Validate ID parameter
    const timesheetId = parseInt(id);
    if (isNaN(timesheetId)) {
      console.error('GET /api/timesheets/[id] - Invalid ID parameter:', id);
      return NextResponse.json(
        { error: 'Invalid timesheet ID' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('GET /api/timesheets/[id] - Unauthorized access attempt');
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
    
    // First, check if the timesheet exists with a simple query
    console.log('GET /api/timesheets/[id] - Testing basic timesheet query...');
    const [timesheetExists] = await db
      .select({ id: timesheets.id })
      .from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);
        
    if (!timesheetExists) {
      console.log('GET /api/timesheets/[id] - Timesheet not found in database');
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    console.log('GET /api/timesheets/[id] - Timesheet exists, fetching basic details...');
    
    // Fetch basic timesheet data first (without joins)
    let basicTimesheet;
    try {
      [basicTimesheet] = await db
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
        })
        .from(timesheets)
        .where(eq(timesheets.id, timesheetId))
        .limit(1);
    } catch (basicQueryError) {
      console.error('GET /api/timesheets/[id] - Basic timesheet query failed:', basicQueryError);
      return NextResponse.json(
        { error: 'Basic timesheet query failed', details: basicQueryError instanceof Error ? basicQueryError.message : 'Unknown query error' },
        { status: 500 }
      );
    }
        
    if (!basicTimesheet) {
      console.error('GET /api/timesheets/[id] - Basic timesheet query returned no results');
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    console.log('GET /api/timesheets/[id] - Basic timesheet query successful, fetching related data...');
    
    // Now try to fetch related data one by one to identify which join is failing
    let employeeData: any = null;
    let userData: any = null;
    let projectData: any = null;
    let rentalData: any = null;
    let assignmentData: any = null;
    
    try {
      // Try to fetch employee data
      if (basicTimesheet.employeeId) {
        const [employee] = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            fileNumber: employees.fileNumber,
            userId: employees.userId,
          })
          .from(employees)
          .where(eq(employees.id, basicTimesheet.employeeId))
          .limit(1);
        employeeData = employee || null;
        console.log('GET /api/timesheets/[id] - Employee data fetched successfully');
      }
    } catch (employeeError) {
      console.warn('GET /api/timesheets/[id] - Failed to fetch employee data:', employeeError);
    }
    
    try {
      // Try to fetch user data
      if (employeeData?.userId) {
        const [user] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, employeeData.userId))
          .limit(1);
        userData = user || null;
        console.log('GET /api/timesheets/[id] - User data fetched successfully');
      }
    } catch (userError) {
      console.warn('GET /api/timesheets/[id] - Failed to fetch user data:', userError);
    }
    
    try {
      // Try to fetch project data
      if (basicTimesheet.projectId) {
        const [project] = await db
          .select({
            id: projects.id,
            name: projects.name,
          })
          .from(projects)
          .where(eq(projects.id, basicTimesheet.projectId))
          .limit(1);
        projectData = project || null;
        console.log('GET /api/timesheets/[id] - Project data fetched successfully');
      }
    } catch (projectError) {
      console.warn('GET /api/timesheets/[id] - Failed to fetch project data:', projectError);
    }
    
    try {
      // Try to fetch rental data
      if (basicTimesheet.rentalId) {
        const [rental] = await db
          .select({
            id: rentals.id,
            rentalNumber: rentals.rentalNumber,
          })
          .from(rentals)
          .where(eq(rentals.id, basicTimesheet.rentalId))
          .limit(1);
        rentalData = rental || null;
        console.log('GET /api/timesheets/[id] - Rental data fetched successfully');
      }
    } catch (rentalError) {
      console.warn('GET /api/timesheets/[id] - Failed to fetch rental data:', rentalError);
    }
    
    try {
      // Try to fetch assignment data
      if (basicTimesheet.assignmentId) {
        const [assignment] = await db
          .select({
            id: employeeAssignments.id,
            assignmentType: employeeAssignments.type,
          })
          .from(employeeAssignments)
          .where(eq(employeeAssignments.id, basicTimesheet.assignmentId))
          .limit(1);
        assignmentData = assignment || null;
        console.log('GET /api/timesheets/[id] - Assignment data fetched successfully');
      }
    } catch (assignmentError) {
      console.warn('GET /api/timesheets/[id] - Failed to fetch assignment data:', assignmentError);
    }

    console.log('GET /api/timesheets/[id] - All related data queries completed');

    // Transform the response to match frontend interface
    const transformedTimesheet = {
      id: basicTimesheet.id.toString(),
      employeeId: basicTimesheet.employeeId.toString(),
      date: basicTimesheet.date ? String(basicTimesheet.date).split('T')[0] : new Date().toISOString().split('T')[0],
      hoursWorked: basicTimesheet.hoursWorked || '0',
      overtimeHours: basicTimesheet.overtimeHours || '0',
      startTime: basicTimesheet.startTime ? String(basicTimesheet.startTime) : '',
      endTime: basicTimesheet.endTime ? String(basicTimesheet.endTime) : '',
      status: basicTimesheet.status || 'pending',
      projectId: basicTimesheet.projectId?.toString() || undefined,
      rentalId: basicTimesheet.rentalId?.toString() || undefined,
      assignmentId: basicTimesheet.assignmentId?.toString() || undefined,
      description: basicTimesheet.description || '',
      tasksCompleted: basicTimesheet.tasks || '',
      notes: basicTimesheet.notes || '',
      submittedAt: basicTimesheet.submittedAt ? String(basicTimesheet.submittedAt) : '',
      approvedBy: userData?.name || '',
      approvedAt: basicTimesheet.approvedAt ? String(basicTimesheet.approvedAt) : '',
      createdAt: String(basicTimesheet.createdAt),
      updatedAt: String(basicTimesheet.updatedAt),
      employee: employeeData ? {
        id: employeeData.id.toString(), 
        firstName: employeeData.firstName || '',
        lastName: employeeData.lastName || '',
        employeeId: employeeData.fileNumber || '',
        user: userData ? {
          name: userData.name,
          email: userData.email,
        } : undefined,
      } : {
        id: '',
        firstName: '',
        lastName: '',
        employeeId: '',
        user: undefined,
      },
      project: projectData ? {
        id: projectData.id.toString(),
        name: projectData.name,
      } : undefined,
      rental: rentalData ? {
        id: rentalData.id.toString(),
        rentalNumber: rentalData.rentalNumber,
      } : undefined,
      assignment: assignmentData ? {
        id: assignmentData.id.toString(),
        name: assignmentData.assignmentType || '',
        type: assignmentData.assignmentType,
      } : undefined,
    };

    console.log('GET /api/timesheets/[id] - Returning transformed timesheet');
    return NextResponse.json({ timesheet: transformedTimesheet });
  } catch (error) {
    console.error('GET /api/timesheets/[id] - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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
