import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { advancePayments, employees, users } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, desc, eq, isNull, like, or } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/advances - List employee advances with employee data filtering
const getAdvancesHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }
) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const employeeId = searchParams.get('employeeId') || '';

    const skip = (page - 1) * limit;

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;

    let employeeFilter: ReturnType<typeof eq> | null = null;

    // Use permission-based access control
    // Check if user has permission to read all advances or only their own
    const { checkUserPermission } = await import('@/lib/rbac/permission-service');
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user can read all advances (has manage.Advance or read.Advance with full access)
    const canReadAllAdvances = await checkUserPermission(user.id, 'manage', 'Advance');
    const canReadOwnAdvances = await checkUserPermission(user.id, 'read', 'Advance');
    
    if (!canReadAllAdvances.hasPermission && !canReadOwnAdvances.hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access advances' },
        { status: 403 }
      );
    }
    
    // If user can only read their own advances, restrict the query
    if (!canReadAllAdvances.hasPermission && canReadOwnAdvances.hasPermission) {
      // For users who can only read their own advances, find their employee record
      try {
        const [ownEmployee] = await db
          .select({ id: employees.id })
          .from(employees)
          .where(eq(employees.userId, parseInt(user.id)))
          .limit(1);
        if (ownEmployee) {
          employeeFilter = eq(advancePayments.employeeId, ownEmployee.id);
        } else {
          // If no employee record found, don't show any advances
          employeeFilter = eq(advancePayments.employeeId, -1);
        }
      } catch (error) {
        console.error('Error finding employee for user:', error);
        employeeFilter = eq(advancePayments.employeeId, -1);
      }
    }
    // If user has manage.Advance permission, they can see all advances (no restriction)

    // Build where conditions
    const whereConditions: Array<ReturnType<typeof eq> | ReturnType<typeof isNull> | ReturnType<typeof like>> = [isNull(advancePayments.deletedAt)];

    if (employeeFilter) {
      whereConditions.push(employeeFilter);
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(advancePayments.status, status));
    }

    if (employeeId) {
      whereConditions.push(eq(advancePayments.employeeId, parseInt(employeeId)));
    }

    // Handle search with joins
    let searchQuery: any = null;
    if (search) {
      searchQuery = or(
        like(employees.firstName, `%${search}%`),
        like(employees.lastName, `%${search}%`),
        like(employees.fileNumber, `%${search}%`),
        like(advancePayments.reason, `%${search}%`)
      );
    }

    if (searchQuery) {
      whereConditions.push(searchQuery);
    }

    const whereClause = and(...whereConditions);

    // Get advances with employee data
    const advancesRows = await db
      .select({
        id: advancePayments.id,
        employeeId: advancePayments.employeeId,
        amount: advancePayments.amount,
        purpose: advancePayments.purpose,
        reason: advancePayments.reason,
        status: advancePayments.status,
        notes: advancePayments.notes,
        repaidAmount: advancePayments.repaidAmount,
        createdAt: advancePayments.createdAt,
        updatedAt: advancePayments.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        } as any,
      })
      .from(advancePayments)
      .leftJoin(employees, eq(advancePayments.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(whereClause)
      .orderBy(desc(advancePayments.createdAt))
      .limit(limit)
      .offset(skip);

    // Get total count
    const totalRows = await db
      .select({ count: advancePayments.id })
      .from(advancePayments)
      .leftJoin(employees, eq(advancePayments.employeeId, employees.id))
      .where(whereClause);

    const total = totalRows.length;
    const totalPages = Math.ceil(total / limit);

    // Transform data to match expected format
    const advances = advancesRows.map(row => ({
      id: row.id,
      employee_id: row.employeeId,
      amount: row.amount,
      purpose: row.purpose,
      reason: row.reason,
      status: row.status,
      notes: row.notes,
      repaidAmount: row.repaidAmount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      employee: row.employee
        ? {
            id: row.employee.id,
            first_name: row.employee.firstName,
            last_name: row.employee.lastName,
            file_number: row.employee.fileNumber,
            user: row.employee.user,
          }
        : null,
    }));

    return NextResponse.json({
      data: advances,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/advances?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/advances?page=${page - 1}` : null,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to fetch advances',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// POST /api/advances - Create employee advance with employee data filtering
const createAdvanceHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }
) => {
  try {
    const body = await request.json();
    const { employeeId, amount, reason, status = 'pending', notes } = body;

    // For employee users, ensure they can only create advances for themselves
    if (request.employeeAccess?.ownEmployeeId) {
      if (employeeId && parseInt(employeeId) !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: 'You can only create advances for yourself' },
          { status: 403 }
        );
      }
      // Override employeeId to ensure it's the user's own employee ID
      body.employeeId = request.employeeAccess.ownEmployeeId.toString();
    }

    const advanceRows = await db
      .insert(advancePayments)
      .values({
        employeeId: parseInt(body.employeeId),
        amount: parseFloat(amount).toString(),
        purpose: reason, // Using reason as purpose
        reason,
        status,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const advance = advanceRows[0];

    if (!advance) {
      return NextResponse.json({ error: 'Failed to create advance' }, { status: 500 });
    }

    // Get employee data for response
    const employeeRows = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .where(eq(employees.id, advance.employeeId))
      .limit(1);

    const employee = employeeRows[0];

    const advanceWithEmployee = {
      id: advance.id,
      employee_id: advance.employeeId,
      amount: advance.amount,
      purpose: advance.purpose,
      reason: advance.reason,
      status: advance.status,
      notes: advance.notes,
      createdAt: advance.createdAt,
      updatedAt: advance.updatedAt,
      employee: employee
        ? {
            id: employee.id,
            first_name: employee.firstName,
            last_name: employee.lastName,
            user: employee.user,
          }
        : null,
    };

    return NextResponse.json(
      {
        message: 'Advance created successfully',
        data: advanceWithEmployee,
      },
      { status: 201 }
    );
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to create advance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// PUT /api/advances - Update employee advance with permission check
export const PUT = withPermission(PermissionConfigs.advance.update)(
  async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
    try {
      const body = await request.json();
      const { id, employeeId, amount, reason, status, notes } = body;

      const advanceRows = await db
        .update(advancePayments)
        .set({
          employeeId: employeeId,
          amount: parseFloat(amount).toString(),
          purpose: reason, // Using reason as purpose
          reason,
          status,
          notes: notes || '',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(advancePayments.id, id))
        .returning();

      const advance = advanceRows[0];

      if (!advance) {
        return NextResponse.json({ error: 'Failed to update advance' }, { status: 500 });
      }

      // Get employee data for response
      const employeeRows = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(employees)
        .leftJoin(users, eq(employees.userId, users.id))
        .where(eq(employees.id, advance.employeeId))
        .limit(1);

      const employee = employeeRows[0];

      const advanceWithEmployee = {
        id: advance.id,
        employee_id: advance.employeeId,
        amount: advance.amount,
        purpose: advance.purpose,
        reason: advance.reason,
        status: advance.status,
        notes: advance.notes,
        createdAt: advance.createdAt,
        updatedAt: advance.updatedAt,
        employee: employee
          ? {
              id: employee.id,
              first_name: employee.firstName,
              last_name: employee.lastName,
              user: employee.user,
            }
          : null,
      };

      return NextResponse.json(advanceWithEmployee);
    } catch (error) {
      
      return NextResponse.json(
        {
          error: 'Failed to update advance',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
  // No specific permission config for PUT, as it's for own data
);

// DELETE /api/advances - Delete employee advance with permission check
export const DELETE = withPermission(PermissionConfigs.advance.delete)(
  async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
    try {
      const body = await request.json();
      const { id } = body;

      await db.delete(advancePayments).where(eq(advancePayments.id, id));

      return NextResponse.json({ message: 'Advance deleted successfully' });
    } catch (error) {
      
      return NextResponse.json(
        {
          error: 'Failed to delete advance',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
  // No specific permission config for DELETE, as it's for own data
);

// Export the wrapped handlers
export const GET = withPermission(PermissionConfigs.advance.read)(getAdvancesHandler);
export const POST = withPermission(PermissionConfigs.advance.create)(createAdvanceHandler);
