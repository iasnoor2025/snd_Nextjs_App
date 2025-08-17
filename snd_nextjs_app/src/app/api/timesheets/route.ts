import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { timesheets as timesheetsTable, employees } from '@/lib/drizzle/schema';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';
import { withAuth } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

// GET /api/timesheets - List timesheets with employee data filtering
const getTimesheetsHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const month = searchParams.get('month') || '';
    const employeeId = searchParams.get('employeeId') || '';
    const test = searchParams.get('test') || '';

    // Allow test access without authentication
    if (test === 'true') {
      
      const rows = await db
        .select({
          id: timesheetsTable.id,
          employee_id: timesheetsTable.employeeId,
          date: timesheetsTable.date,
          hours_worked: timesheetsTable.hoursWorked,
          overtime_hours: timesheetsTable.overtimeHours,
          start_time: timesheetsTable.startTime,
          end_time: timesheetsTable.endTime,
          status: timesheetsTable.status,
          project_id: timesheetsTable.projectId,
          rental_id: timesheetsTable.rentalId,
          assignment_id: timesheetsTable.assignmentId,
          description: timesheetsTable.description,
          tasks: timesheetsTable.tasks,
          submitted_at: timesheetsTable.submittedAt,
          approved_at: timesheetsTable.approvedAt,
          created_at: timesheetsTable.createdAt,
          updated_at: timesheetsTable.updatedAt,
          employee: {
            id: employees.id,
            first_name: employees.firstName,
            last_name: employees.lastName,
            file_number: employees.fileNumber,
          },
        })
        .from(timesheetsTable)
        .leftJoin(employees, eq(timesheetsTable.employeeId, employees.id))
        .orderBy(desc(timesheetsTable.date))
        .limit(10);

      // Transform the response to match frontend interface
      const transformedTimesheets = rows.map(timesheet => ({
        id: timesheet.id.toString(),
        employeeId: timesheet.employee_id?.toString?.() ?? String(timesheet.employee_id),
        date: new Date(timesheet.date as unknown as string).toISOString().split('T')[0],
        hoursWorked: timesheet.hours_worked,
        overtimeHours: timesheet.overtime_hours,
        startTime: timesheet.start_time ? new Date(timesheet.start_time as unknown as string).toISOString() : '',
        endTime: timesheet.end_time ? new Date(timesheet.end_time as unknown as string).toISOString() : '',
        status: timesheet.status,
        projectId: timesheet.project_id ? String(timesheet.project_id) : undefined,
        rentalId: timesheet.rental_id ? String(timesheet.rental_id) : undefined,
        assignmentId: timesheet.assignment_id ? String(timesheet.assignment_id) : undefined,
        description: timesheet.description || '',
        tasksCompleted: timesheet.tasks || '',
        submittedAt: timesheet.submitted_at ? new Date(timesheet.submitted_at as unknown as string).toISOString() : '',
        approvedBy: '',
        approvedAt: timesheet.approved_at ? new Date(timesheet.approved_at as unknown as string).toISOString() : '',
        createdAt: new Date(timesheet.created_at as unknown as string).toISOString(),
        updatedAt: new Date(timesheet.updated_at as unknown as string).toISOString(),
        employee: timesheet.employee ? {
          id: String((timesheet.employee as any).id),
          firstName: (timesheet.employee as any).first_name as unknown as string,
          lastName: (timesheet.employee as any).last_name as unknown as string,
          fileNumber: (timesheet.employee as any).file_number as unknown as string,
        } : undefined,
      }));

      return NextResponse.json({
        data: transformedTimesheets,
        total: transformedTimesheets.length,
        message: 'Test access successful'
      });
    }

    const skip = (page - 1) * limit;

    const filters: any[] = [];

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, only show their own timesheets
    if (user?.role === 'EMPLOYEE') {
      // Find employee record that matches user's national_id
      // filter by employee national id
      filters.push(eq(employees.iqamaNumber, user.national_id as unknown as string));
    }

    if (search) {
      filters.push(
        or(
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`),
          ilike(employees.fileNumber, `%${search}%`)
        )
      );
    }

    if (status && status !== 'all') {
      filters.push(eq(timesheetsTable.status, status));
    }

    if (month) {
      // Parse month filter (format: YYYY-MM)
      const [year, monthNum] = month.split('-');
      if (year && monthNum) {
        console.log(`Month filter: ${month} -> Year: ${year}, Month: ${monthNum}`);
        
        // Use raw SQL to avoid timezone conversion issues
        const monthFilter = sql`
          EXTRACT(YEAR FROM timesheets.date) = ${parseInt(year)} 
          AND EXTRACT(MONTH FROM timesheets.date) = ${parseInt(monthNum)}
        `;
        
        filters.push(monthFilter);
        
        console.log(`Applied month filter for ${month}`);
      }
    }

    if (employeeId) {
      filters.push(eq(timesheetsTable.employeeId, parseInt(employeeId)));
    }

    const conditions = filters.length ? and(...filters) : undefined;

    console.log(`Timesheet query filters:`, filters.length, 'filters applied');
    if (month) {
      console.log(`Month filter active for: ${month}`);
    }

    const listRows = await db
      .select({
        id: timesheetsTable.id,
        employee_id: timesheetsTable.employeeId,
        date: timesheetsTable.date,
        hours_worked: timesheetsTable.hoursWorked,
        overtime_hours: timesheetsTable.overtimeHours,
        start_time: timesheetsTable.startTime,
        end_time: timesheetsTable.endTime,
        status: timesheetsTable.status,
        project_id: timesheetsTable.projectId,
        rental_id: timesheetsTable.rentalId,
        assignment_id: timesheetsTable.assignmentId,
        description: timesheetsTable.description,
        tasks: timesheetsTable.tasks,
        submitted_at: timesheetsTable.submittedAt,
        approved_at: timesheetsTable.approvedAt,
        created_at: timesheetsTable.createdAt,
        updated_at: timesheetsTable.updatedAt,
        emp_id: employees.id,
        emp_first: employees.firstName,
        emp_last: employees.lastName,
        emp_file_number: employees.fileNumber,
      })
      .from(timesheetsTable)
      .leftJoin(employees, eq(timesheetsTable.employeeId, employees.id))
      .where(conditions)
      .orderBy(desc(timesheetsTable.date))
      .offset(skip)
      .limit(limit);

    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(timesheetsTable)
      .leftJoin(employees, eq(timesheetsTable.employeeId, employees.id))
      .where(conditions);

    const total = Number(totalRow[0]?.count ?? 0);

    console.log(`Timesheet query results: ${listRows.length} timesheets found, total: ${total}`);

    // Transform the response to match frontend interface
    const transformedTimesheets = listRows.map(timesheet => ({
      id: timesheet.id.toString(),
      employeeId: timesheet.employee_id?.toString?.() ?? String(timesheet.employee_id),
      // Use the date directly without timezone conversion to avoid -1 day issue
      date: timesheet.date ? String(timesheet.date).split('T')[0] : '',
      hoursWorked: timesheet.hours_worked,
      overtimeHours: timesheet.overtime_hours,
      // Use times directly without timezone conversion
      startTime: timesheet.start_time ? String(timesheet.start_time) : '',
      endTime: timesheet.end_time ? String(timesheet.end_time) : '',
      status: timesheet.status,
      projectId: timesheet.project_id ? String(timesheet.project_id) : undefined,
      rentalId: timesheet.rental_id ? String(timesheet.rental_id) : undefined,
      assignmentId: timesheet.assignment_id ? String(timesheet.assignment_id) : undefined,
      description: timesheet.description || '',
      tasksCompleted: timesheet.tasks || '',
      submittedAt: timesheet.submitted_at ? String(timesheet.submitted_at) : '',
      approvedBy: '',
      approvedAt: timesheet.approved_at ? String(timesheet.approved_at) : '',
      createdAt: String(timesheet.created_at),
      updatedAt: String(timesheet.updated_at),
      employee: timesheet.emp_id ? {
        id: String(timesheet.emp_id),
        firstName: timesheet.emp_first as unknown as string,
        lastName: timesheet.emp_last as unknown as string,
        fileNumber: timesheet.emp_file_number as unknown as string,
      } : undefined,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: transformedTimesheets,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/timesheets?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/timesheets?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

// GET /api/timesheets - List timesheets with permission check
export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test');
  
  // Check if this is a test request (bypasses authentication)
  if (test === 'true') {
    return getTimesheetsHandler(request);
  }
  
  // Apply authentication middleware for regular requests
  const authenticatedHandler = withAuth(getTimesheetsHandler);
  return authenticatedHandler(request);
};

// POST /api/timesheets - Create timesheet with permission check
export const POST = withAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();

      // Handle both Laravel-style and Next.js-style field names
      const employeeId = body.employee_id || body.employeeId;
      const date = body.date;
      const hoursWorked = body.hours_worked || body.hoursWorked;
      const overtimeHours = body.overtime_hours || body.overtimeHours;
      const startTime = body.start_time || body.startTime;
      const endTime = body.end_time || body.endTime;
      const status = body.status;
      const projectId = body.project_id || body.projectId;
      const rentalId = body.rental_id || body.rentalId;
      const assignmentId = body.assignment_id || body.assignmentId;
      const description = body.description;
      const tasksCompleted = body.tasks_completed || body.tasksCompleted;
      const notes = body.notes;

      const inserted = await db
        .insert(timesheetsTable)
        .values({
          employeeId: parseInt(employeeId),
          date: new Date(date).toISOString(),
          hoursWorked: String(parseFloat(hoursWorked || '0')),
          overtimeHours: String(parseFloat(overtimeHours || '0')),
          startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
          endTime: endTime ? new Date(endTime).toISOString() : null,
          status: status || 'draft',
          projectId: projectId ? parseInt(projectId) : null,
          rentalId: rentalId ? parseInt(rentalId) : null,
          assignmentId: assignmentId ? parseInt(assignmentId) : null,
          description,
          tasks: tasksCompleted,
          notes,
          updatedAt: new Date().toISOString(),
        })
        .returning();

      return NextResponse.json(inserted[0], { status: 201 });
    } catch (error) {
      console.error('Error creating timesheet:', error);
      return NextResponse.json(
        { error: 'Failed to create timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
);

// PUT /api/timesheets - Update timesheet with permission check
export const PUT = withAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const {
        id,
        employeeId,
        date,
        hoursWorked,
        overtimeHours,
        startTime,
        endTime,
        status,
        projectId,
        rentalId,
        assignmentId,
        description,
        tasksCompleted,
        notes,
      } = body;

      const updated = await db
        .update(timesheetsTable)
        .set({
          employeeId,
          date: new Date(date).toISOString(),
          hoursWorked: String(parseFloat(hoursWorked || '0')),
          overtimeHours: String(parseFloat(overtimeHours || '0')),
          startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
          endTime: endTime ? new Date(endTime).toISOString() : null,
          status,
          projectId: projectId ?? null,
          rentalId: rentalId ?? null,
          assignmentId: assignmentId ?? null,
          description,
          tasks: tasksCompleted,
          notes,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(timesheetsTable.id, id))
        .returning();

      return NextResponse.json(updated[0]);
    } catch (error) {
      console.error('Error updating timesheet:', error);
      return NextResponse.json(
        { error: 'Failed to update timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/timesheets - Delete timesheet with permission check
export const DELETE = withAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { id } = body;

      await db.delete(timesheetsTable).where(eq(timesheetsTable.id, id));

      return NextResponse.json({ message: 'Timesheet deleted successfully' });
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      return NextResponse.json(
        { error: 'Failed to delete timesheet', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
);
