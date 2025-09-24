import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeAssignments, employees, projects, users } from '@/lib/drizzle/schema';
import { withEmployeeListPermission } from '@/lib/rbac/api-middleware';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/assignments - List manual assignments with employee data filtering
const getAssignmentsHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }
) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const employeeId = searchParams.get('employeeId') || '';
    const projectId = searchParams.get('projectId') || '';

    const skip = (page - 1) * limit;

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;

    // Build base filters array
    const baseFilters: any[] = [];

    // Use role-based access control instead of national_id
    // Admin/Manager users can see all assignments, Employee users see their own
    if (user?.role === 'EMPLOYEE') {
      // For employee users, find their employee record and restrict to their assignments
      try {
        const [ownEmployee] = await db
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.userId, parseInt(user.id)))
          .limit(1);
        if (ownEmployee) {
          baseFilters.push(eq(employeeAssignments.employeeId, ownEmployee.id));
        } else {
          // If we can't find the employee, don't show any assignments
          baseFilters.push(eq(employeeAssignments.employeeId, -1)); // This will ensure no results
        }
      } catch (error) {
        console.error('Error finding employee for user:', error);
        // If we can't find the employee, don't show any assignments
        baseFilters.push(eq(employeeAssignments.employeeId, -1)); // This will ensure no results
      }
    }
    // For ADMIN, MANAGER, SUPERVISOR, SUPER_ADMIN roles, show all assignments (no restriction)

    // Add search filters
    const searchFilters = search
      ? [
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`),
          ilike(employees.fileNumber, `%${search}%`),
          ilike(projects.name, `%${search}%`),
          ilike(employeeAssignments.type, `%${search}%`),
        ]
      : [];

    // Add status filter
    if (status && status !== 'all') {
      baseFilters.push(eq(employeeAssignments.status, status));
    }

    // Add employee filter
    if (employeeId) {
      baseFilters.push(eq(employeeAssignments.employeeId, parseInt(employeeId)));
    }

    // Add project filter
    if (projectId) {
      baseFilters.push(eq(employeeAssignments.projectId, parseInt(projectId)));
    }

    // Add search filters
    if (searchFilters.length > 0) {
      baseFilters.push(or(...searchFilters));
    }

    // Build Drizzle query with filters
    const baseQuery = db
      .select({
        id: employeeAssignments.id,
        employeeId: employeeAssignments.employeeId,
        projectId: employeeAssignments.projectId,
        assignmentType: employeeAssignments.type,
        status: employeeAssignments.status,
        startDate: employeeAssignments.startDate,
        endDate: employeeAssignments.endDate,
        name: employeeAssignments.name,
        location: employeeAssignments.location,
        notes: employeeAssignments.notes,
        createdAt: employeeAssignments.createdAt,
        updatedAt: employeeAssignments.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          userId: employees.userId,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(employeeAssignments)
      .leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
      .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
      .leftJoin(users, eq(employees.userId, users.id));

    // Apply filters only if there are any
    const filteredQuery = baseFilters.length > 0 
      ? baseQuery.where(and(...baseFilters))
      : baseQuery;

    const [assignments, total] = await Promise.all([
      filteredQuery.orderBy(desc(employeeAssignments.createdAt)).offset(skip).limit(limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(employeeAssignments)
        .leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
        .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .where(baseFilters.length > 0 ? and(...baseFilters) : undefined),
    ]);

    const totalCount = Number(total[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: assignments,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total: totalCount,
      next_page_url: page < totalPages ? `/api/assignments?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/assignments?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error in getAssignmentsHandler:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// POST /api/assignments - Create manual assignment with employee data filtering
const createAssignmentHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }
) => {
  try {
    const body = await request.json();
    const {
      employeeId,
      projectId,
      assignmentType,
      startDate,
      endDate,
      status = 'pending',
      name,
      location,
      notes,
    } = body;

    // For employee users, ensure they can only create assignments for themselves
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId && parseInt(employeeId) !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: 'You can only create assignments for yourself' },
          { status: 403 }
        );
      }
      // Override employeeId to ensure it's the user's own employee ID
      body.employeeId = request.employeeAccess.ownEmployeeId.toString();
    }

    const [assignment] = await db
      .insert(employeeAssignments)
      .values({
        employeeId: parseInt(body.employeeId),
        projectId: projectId ? parseInt(projectId) : null,
        type: assignmentType,
        name: name || '',
        location: location || '',
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        status,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    if (!assignment) {
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }

    // Fetch the created assignment with related data
    const [assignmentWithDetails] = await db
      .select({
        id: employeeAssignments.id,
        employeeId: employeeAssignments.employeeId,
        projectId: employeeAssignments.projectId,
        assignmentType: employeeAssignments.type,
        startDate: employeeAssignments.startDate,
        endDate: employeeAssignments.endDate,
        status: employeeAssignments.status,
        description: employeeAssignments.notes,
        createdAt: employeeAssignments.createdAt,
        updatedAt: employeeAssignments.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          userId: employees.userId,
        },
        project: {
          id: projects.id,
          name: projects.name,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(employeeAssignments)
      .leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
      .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(eq(employeeAssignments.id, assignment.id))
      .limit(1);

    return NextResponse.json(
      {
        message: 'Assignment created successfully',
        data: assignmentWithDetails,
      },
      { status: 201 }
    );
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// PUT /api/assignments - Update manual assignment with permission check
export const PUT = withEmployeeListPermission(
  async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
    try {
      const body = await request.json();
      const { id, employeeId, projectId, assignmentType, startDate, endDate, status, name, location, notes } = body;

      await db
        .update(employeeAssignments)
        .set({
          employeeId: employeeId,
          projectId: projectId,
          type: assignmentType || 'manual',
          name: name,
          location: location,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          status,
          notes: notes,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(employeeAssignments.id, id));

      // Fetch the updated assignment with related data
      const [assignmentWithDetails] = await db
        .select({
          id: employeeAssignments.id,
          employeeId: employeeAssignments.employeeId,
          projectId: employeeAssignments.projectId,
          assignmentType: employeeAssignments.type,
          startDate: employeeAssignments.startDate,
          endDate: employeeAssignments.endDate,
          status: employeeAssignments.status,
          description: employeeAssignments.notes,
          createdAt: employeeAssignments.createdAt,
          updatedAt: employeeAssignments.updatedAt,
          employee: {
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            fileNumber: employees.fileNumber,
            userId: employees.userId,
          },
          project: {
            id: projects.id,
            name: projects.name,
          },
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(employeeAssignments)
        .leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
        .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
        .leftJoin(users, eq(employees.userId, users.id))
        .where(eq(employeeAssignments.id, id))
        .limit(1);

      return NextResponse.json(assignmentWithDetails);
    } catch (error) {
      
      return NextResponse.json(
        {
          error: 'Failed to update assignment',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
  // No specific permission config for PUT, as it's handled by withAuth
);

// DELETE /api/assignments - Delete manual assignment with permission check
export const DELETE = withEmployeeListPermission(
  async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
    try {
      const body = await request.json();
      const { id } = body;

      await db.delete(employeeAssignments).where(eq(employeeAssignments.id, id));

      return NextResponse.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
      
      return NextResponse.json(
        {
          error: 'Failed to delete assignment',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
  // No specific permission config for DELETE, as it's handled by withAuth
);

// Bulk DELETE /api/assignments - Delete multiple assignments
const bulkDeleteAssignmentsHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }
) => {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of assignment IDs to delete' },
        { status: 400 }
      );
    }

    // Validate that all IDs are numbers
    const validIds = ids.filter((id: any) => !isNaN(Number(id))).map((id: any) => Number(id));

    if (validIds.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some assignment IDs are invalid' },
        { status: 400 }
      );
    }

    // For employee users, ensure they can only delete their own assignments
    if (request.employeeAccess?.ownEmployeeId) {
      const assignments = await db
        .select({ id: employeeAssignments.id, employeeId: employeeAssignments.employeeId })
        .from(employeeAssignments)
        .where(and(
          inArray(employeeAssignments.id, validIds),
          eq(employeeAssignments.employeeId, request.employeeAccess.ownEmployeeId)
        ));

      if (assignments.length !== validIds.length) {
        return NextResponse.json(
          { error: 'You can only delete your own assignments' },
          { status: 403 }
        );
      }
    }

    // Delete the assignments
    const deletedAssignments = await db
      .delete(employeeAssignments)
      .where(inArray(employeeAssignments.id, validIds))
      .returning();

    return NextResponse.json({
      message: `Successfully deleted ${deletedAssignments.length} assignments`,
      deleted: deletedAssignments.length,
      data: deletedAssignments,
    });
  } catch (error) {
    console.error('Error in bulkDeleteAssignmentsHandler:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// Export the wrapped handlers
export const GET = withEmployeeListPermission(getAssignmentsHandler);
export const POST = withEmployeeListPermission(createAssignmentHandler);
