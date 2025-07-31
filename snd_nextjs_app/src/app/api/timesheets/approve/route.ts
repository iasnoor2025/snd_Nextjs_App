import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timesheetId, approvalStage, notes } = await request.json();

    // Get the timesheet
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    // Check if user has permission to approve at this stage
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { user_roles: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate approval stage
    const validStages = ['foreman', 'incharge', 'checking', 'manager'];
    if (!validStages.includes(approvalStage)) {
      return NextResponse.json({ error: 'Invalid approval stage' }, { status: 400 });
    }

    // Check if timesheet can be approved at this stage
    let canApprove = false;
    let newStatus = '';

    switch (approvalStage) {
      case 'foreman':
        canApprove = timesheet.status === 'submitted';
        newStatus = 'foreman_approved';
        break;
      case 'incharge':
        canApprove = timesheet.status === 'foreman_approved';
        newStatus = 'incharge_approved';
        break;
      case 'checking':
        canApprove = timesheet.status === 'incharge_approved';
        newStatus = 'checking_approved';
        break;
      case 'manager':
        canApprove = timesheet.status === 'checking_approved';
        newStatus = 'manager_approved';
        break;
    }

    if (!canApprove) {
      return NextResponse.json({
        error: `Timesheet cannot be approved at ${approvalStage} stage. Current status: ${timesheet.status}`
      }, { status: 400 });
    }

    // Check permissions based on user role
    const userRole = session.user.role;
    let hasPermission = false;

    switch (approvalStage) {
      case 'foreman':
        hasPermission = userRole === 'FOREMAN' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        break;
      case 'incharge':
        hasPermission = userRole === 'TIMESHEET_INCHARGE' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        break;
      case 'checking':
        hasPermission = userRole === 'TIMESHEET_CHECKER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        break;
      case 'manager':
        hasPermission = userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        break;
    }

    if (!hasPermission) {
      return NextResponse.json({
        error: `You don't have permission to approve at ${approvalStage} stage`
      }, { status: 403 });
    }

    // Update timesheet with approval
    const updateData: any = {
      status: newStatus
    };

    switch (approvalStage) {
      case 'foreman':
        updateData.foremanApprovalBy = session.user.id;
        updateData.foremanApprovalAt = new Date();
        updateData.foremanApprovalNotes = notes;
        break;
      case 'incharge':
        updateData.timesheetInchargeApprovalBy = session.user.id;
        updateData.timesheetInchargeApprovalAt = new Date();
        updateData.timesheetInchargeApprovalNotes = notes;
        break;
      case 'checking':
        updateData.timesheetCheckingApprovalBy = session.user.id;
        updateData.timesheetCheckingApprovalAt = new Date();
        updateData.timesheetCheckingApprovalNotes = notes;
        break;
      case 'manager':
        updateData.managerApprovalBy = session.user.id;
        updateData.managerApprovalAt = new Date();
        updateData.managerApprovalNotes = notes;
        break;
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: timesheetId },
      data: updateData,
      include: {
        employee: {
          include: {
            user: true
          }
        },
        approved_by_user: true
      }
    });

    return NextResponse.json({
      message: `Timesheet approved at ${approvalStage} stage`,
      timesheet: updatedTimesheet
    });

  } catch (error) {
    console.error('Error approving timesheet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
