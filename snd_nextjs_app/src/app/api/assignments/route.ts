import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma, safePrismaOperation } from '@/lib/db';
import { withEmployeeListPermission } from '@/lib/rbac/api-middleware';
import { authConfig } from '@/lib/auth-config';

// GET /api/assignments - List manual assignments with employee data filtering
const getAssignmentsHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const employeeId = searchParams.get('employeeId') || '';
    const projectId = searchParams.get('projectId') || '';

    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;
    
    // For employee users, only show their own assignments
    if (user?.role === 'EMPLOYEE') {
      // Find employee record that matches user's national_id
      const ownEmployee = await safePrismaOperation<{ id: number } | null>(() => 
        prisma.employee.findFirst({
          where: { iqama_number: user.national_id },
          select: { id: true },
        })
      );
      if (ownEmployee) {
        where.employee_id = ownEmployee.id;
      }
    }

    if (search) {
      where.OR = [
        { employee: { first_name: { contains: search, mode: 'insensitive' } } },
        { employee: { last_name: { contains: search, mode: 'insensitive' } } },
        { employee: { employee_id: { contains: search, mode: 'insensitive' } } },
        { project: { name: { contains: search, mode: 'insensitive' } } },
        { assignment_type: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (employeeId) {
      where.employee_id = employeeId;
    }

    if (projectId) {
      where.project_id = projectId;
    }

    const [assignments, total] = await Promise.all([
      safePrismaOperation<any[]>(() => 
        prisma.employeeAssignment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            employee: {
              include: {
                user: true,
              },
            },
            project: true,
          },
        })
      ),
      safePrismaOperation<number>(() => 
        prisma.employeeAssignment.count({ where })
      ),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: assignments,
      current_page: page,
      last_page: totalPages,
      per_page: limit,
      total,
      next_page_url: page < totalPages ? `/api/assignments?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/assignments?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

// POST /api/assignments - Create manual assignment with employee data filtering
const createAssignmentHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    const body = await request.json();
    const {
      employeeId,
      projectId,
      assignmentType,
      startDate,
      endDate,
      hoursPerDay,
      status = 'pending',
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

    const assignment = await prisma.employeeAssignment.create({
      data: {
        employee_id: parseInt(body.employeeId),
        project_id: projectId ? parseInt(projectId) : null,
        type: assignmentType,
        start_date: new Date(startDate),
        end_date: endDate ? new Date(endDate) : null,
        status,
        notes: notes || '',
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        project: true,
      },
    });

    return NextResponse.json({
      message: 'Assignment created successfully',
      data: assignment,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

// PUT /api/assignments - Update manual assignment with permission check
export const PUT = withEmployeeListPermission(
  async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
    try {
      const body = await request.json();
      const {
        id,
        employeeId,
        projectId,
        assignmentType,
        startDate,
        endDate,
        hoursPerDay,
        status,
        notes,
      } = body;

      const assignment = await prisma.employeeAssignment.update({
        where: { id },
        data: {
          employee_id: employeeId,
          project_id: projectId,
          type: assignmentType || 'manual',
          start_date: new Date(startDate),
          end_date: endDate ? new Date(endDate) : null,
          status,
          notes,
        },
        include: {
          employee: {
            include: {
              user: true,
            },
          },
          project: true,
        },
      });

      return NextResponse.json(assignment);
    } catch (error) {
      console.error('Error updating assignment:', error);
      return NextResponse.json(
        { error: 'Failed to update assignment', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  },
  // No specific permission config for PUT, as it's handled by withAuth
);

// DELETE /api/assignments - Delete manual assignment with permission check
export const DELETE = withEmployeeListPermission(
  async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
    try {
      const body = await request.json();
      const { id } = body;

      await prisma.employeeAssignment.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return NextResponse.json(
        { error: 'Failed to delete assignment', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  },
  // No specific permission config for DELETE, as it's handled by withAuth
);

// Export the wrapped handlers
export const GET = withEmployeeListPermission(getAssignmentsHandler);
export const POST = withEmployeeListPermission(createAssignmentHandler); 