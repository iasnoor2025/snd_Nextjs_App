import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { withEmployeeListPermission } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';
import { advancePayments, employees, users } from '@/lib/drizzle/schema';
import { eq, and, or, like, isNull, desc } from 'drizzle-orm';

// GET /api/advances - List employee advances with employee data filtering
const getAdvancesHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
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
    
    let employeeFilter: any = null;
    
    // For employee users, only show their own advances
    if (user?.role === 'EMPLOYEE' && user.national_id) {
      // Find employee record that matches user's national_id
      const ownEmployeeRows = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.iqamaNumber, user.national_id))
        .limit(1);
      
      if (ownEmployeeRows.length > 0 && ownEmployeeRows[0]?.id) {
        employeeFilter = eq(advancePayments.employeeId, ownEmployeeRows[0].id);
      }
    }

    // Build where conditions
    let whereConditions: any[] = [isNull(advancePayments.deletedAt)];

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
          }
        } as any
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
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      employee: row.employee ? {
        id: row.employee.id,
        first_name: row.employee.firstName,
        last_name: row.employee.lastName,
        file_number: row.employee.fileNumber,
        user: row.employee.user
      } : null
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
    console.error('Error fetching advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advances', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

// POST /api/advances - Create employee advance with employee data filtering
const createAdvanceHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    const body = await request.json();  
    const {
      employeeId,
      amount,
      reason,
      status = 'pending',
      notes,
    } = body;

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
        }
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
      created_at: advance.createdAt,
      updated_at: advance.updatedAt,
      employee: employee ? {
        id: employee.id,
        first_name: employee.firstName,
        last_name: employee.lastName,
        user: employee.user
      } : null
    };

    return NextResponse.json({
      message: 'Advance created successfully',
      data: advanceWithEmployee,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating advance:', error);
    return NextResponse.json(
      { error: 'Failed to create advance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

// PUT /api/advances - Update employee advance with permission check
export const PUT = withEmployeeListPermission(
  async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
    try {
      const body = await request.json();
      const {
        id,
        employeeId,
        amount,
        reason,
        status,
        notes,
      } = body;

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
          }
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
        created_at: advance.createdAt,
        updated_at: advance.updatedAt,
        employee: employee ? {
          id: employee.id,
          first_name: employee.firstName,
          last_name: employee.lastName,
          user: employee.user
        } : null
      };

      return NextResponse.json(advanceWithEmployee);
    } catch (error) {
      console.error('Error updating advance:', error);
      return NextResponse.json(
        { error: 'Failed to update advance', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  },
  // No specific permission config for PUT, as it's for own data
);

// DELETE /api/advances - Delete employee advance with permission check
export const DELETE = withEmployeeListPermission(
  async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
    try {
      const body = await request.json();
      const { id } = body;

      await db
        .delete(advancePayments)
        .where(eq(advancePayments.id, id));

      return NextResponse.json({ message: 'Advance deleted successfully' });
    } catch (error) {
      console.error('Error deleting advance:', error);
      return NextResponse.json(
        { error: 'Failed to delete advance', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  },
  // No specific permission config for DELETE, as it's for own data
);

// Export the wrapped handlers
export const GET = withEmployeeListPermission(getAdvancesHandler);
export const POST = withEmployeeListPermission(createAdvanceHandler); 
