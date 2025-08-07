import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET = withPermission(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
  try {
    const { id } = await params;

    // Fetch real leave data from the database
    const leaves = await prisma.employeeLeave.findMany({
      where: {
        employee_id: parseInt(id)
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_id: true
          }
        }
      }
    });

    // Transform the data to match the expected format
    const transformedLeaves = leaves.map(leave => ({
      id: leave.id,
      leave_type: leave.leave_type,
      start_date: leave.start_date.toISOString().split('T')[0],
      end_date: leave.end_date.toISOString().split('T')[0],
      days: leave.days,
      reason: leave.reason || '',
      status: leave.status,
      approved_by: leave.approved_by,
      approved_at: leave.approved_at ? leave.approved_at.toISOString() : null,
      rejected_by: leave.rejected_by,
      rejected_at: leave.rejected_at ? leave.rejected_at.toISOString() : null,
      rejection_reason: leave.rejection_reason,
      created_at: leave.created_at.toISOString(),
      updated_at: leave.updated_at.toISOString(),
      employee: leave.employee
    }));

    return NextResponse.json({
      success: true,
      data: transformedLeaves,
      message: 'Leave requests retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave requests: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.leave.read
);

export const POST = withPermission(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
  try {
    const { id } = await params;
    const body = await request.json();

    // Create new leave request in the database
    const newLeave = await prisma.employeeLeave.create({
      data: {
        employee_id: parseInt(id),
        leave_type: body.leave_type,
        start_date: new Date(body.start_date),
        end_date: new Date(body.end_date),
        days: body.days || 0,
        reason: body.reason || '',
        status: body.status || 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Leave request created successfully',
      data: newLeave
    });
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/leaves:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create leave request: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.leave.create
);
