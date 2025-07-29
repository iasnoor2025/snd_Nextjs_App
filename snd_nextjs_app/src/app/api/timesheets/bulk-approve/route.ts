import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timesheetIds, action, notes } = await request.json();

    if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return NextResponse.json(
        { error: 'Timesheet IDs must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Check user permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employees: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const results = {
      approved: [],
      rejected: [],
      errors: []
    };

    for (const timesheetId of timesheetIds) {
      try {
        // Get the timesheet
        const timesheet = await (prisma.timesheet as any).findUnique({
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
          results.errors.push({
            timesheetId,
            error: 'Timesheet not found'
          });
          continue;
        }

        if (action === 'approve') {
          // Special handling for draft timesheets - they need to be submitted first
          if (timesheet.status === 'draft') {
            // Check if user can submit timesheets (any role can submit their own or admin/manager can submit any)
            const canSubmit = await checkSubmissionPermission(session.user.id, timesheet.employeeId, session.user.role);

            if (!canSubmit.allowed) {
              results.errors.push({
                timesheetId,
                error: canSubmit.reason
              });
              continue;
            }

            // Submit the draft timesheet
            const updatedTimesheet = await (prisma.timesheet as any).update({
              where: { id: timesheetId },
              data: {
                status: 'submitted',
                submittedAt: new Date(),
                notes: notes || timesheet.notes
              },
              include: {
                employee: {
                  include: {
                    user: true
                  }
                }
              }
            });

            results.approved.push(updatedTimesheet);
            continue;
          }

          // Check if user can approve at this stage based on their role
          const canApprove = await checkApprovalPermission(session.user.role, timesheet.status);

          if (!canApprove.allowed) {
            results.errors.push({
              timesheetId,
              error: canApprove.reason
            });
            continue;
          }

          // Check if timesheet is in a state that can be approved
          const canProcess = ['submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);

          if (!canProcess) {
            results.errors.push({
              timesheetId,
              error: `Timesheet cannot be approved. Current status: ${timesheet.status}`
            });
            continue;
          }

          // Determine the next status based on current status and user role
          const nextStatus = getNextApprovalStatus(timesheet.status, session.user.role);
          const approvalField = getApprovalField(timesheet.status, session.user.role);
          const approvalTimeField = getApprovalTimeField(timesheet.status, session.user.role);

          // Update the timesheet
          const updateData: any = {
            status: nextStatus,
            notes: notes || timesheet.notes
          };

          if (approvalField) {
            updateData[approvalField] = session.user.id;
          }
          if (approvalTimeField) {
            updateData[approvalTimeField] = new Date();
          }

          const updatedTimesheet = await (prisma.timesheet as any).update({
            where: { id: timesheetId },
            data: updateData,
            include: {
              employee: {
                include: {
                  user: true
                }
              }
            }
          });

          results.approved.push(updatedTimesheet);

        } else if (action === 'reject') {
          // Check if user can reject at this stage
          const canReject = await checkRejectionPermission(session.user.role, timesheet.status);

          if (!canReject.allowed) {
            results.errors.push({
              timesheetId,
              error: canReject.reason
            });
            continue;
          }

          // Check if timesheet can be rejected
          const canProcess = ['submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);

          if (!canProcess) {
            results.errors.push({
              timesheetId,
              error: `Timesheet cannot be rejected. Current status: ${timesheet.status}`
            });
            continue;
          }

          // Reject the timesheet
          const updatedTimesheet = await (prisma.timesheet as any).update({
            where: { id: timesheetId },
            data: {
              status: 'rejected',
              rejectedBy: session.user.id,
              rejectedAt: new Date(),
              rejectionReason: notes || timesheet.notes,
              rejectionStage: timesheet.status
            },
            include: {
              employee: {
                include: {
                  user: true
                }
              }
            }
          });

          results.rejected.push(updatedTimesheet);
        }

      } catch (error) {
        console.error(`Error processing timesheet ${timesheetId}:`, error);
        results.errors.push({
          timesheetId,
          error: 'Failed to process timesheet'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${action === 'approve' ? results.approved.length : results.rejected.length} timesheets`,
      results
    });

  } catch (error) {
    console.error('Error in bulk approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if user can approve at current stage
async function checkApprovalPermission(userRole: string, currentStatus: string) {
  // Define approval workflow stages and who can approve at each stage
  const approvalWorkflow = {
    submitted: ['FOREMAN', 'MANAGER', 'ADMIN'],
    foreman_approved: ['INCHARGE', 'MANAGER', 'ADMIN'],
    incharge_approved: ['CHECKING', 'MANAGER', 'ADMIN'],
    checking_approved: ['MANAGER', 'ADMIN']
  };

  const allowedRoles = approvalWorkflow[currentStatus as keyof typeof approvalWorkflow];

  if (!allowedRoles) {
    return { allowed: false, reason: 'Invalid timesheet status for approval' };
  }

  if (!allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `You don't have permission to approve at ${currentStatus} stage. Required roles: ${allowedRoles.join(', ')}`
    };
  }

  return { allowed: true };
}

// Helper function to check if user can submit timesheets
async function checkSubmissionPermission(userId: string, employeeId: string, userRole: string) {
  // Admin and Manager can submit any timesheet
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return { allowed: true };
  }

  // Check if user is the employee (can submit their own timesheets)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employees: true }
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  const userEmployeeIds = user.employees.map(emp => emp.id);
  if (userEmployeeIds.includes(employeeId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'You can only submit your own timesheets or have admin/manager permissions'
  };
}

// Helper function to check if user can reject at current stage
async function checkRejectionPermission(userRole: string, currentStatus: string) {
  // Any role that can approve can also reject
  const approvalWorkflow = {
    submitted: ['FOREMAN', 'MANAGER', 'ADMIN'],
    foreman_approved: ['INCHARGE', 'MANAGER', 'ADMIN'],
    incharge_approved: ['CHECKING', 'MANAGER', 'ADMIN'],
    checking_approved: ['MANAGER', 'ADMIN']
  };

  const allowedRoles = approvalWorkflow[currentStatus as keyof typeof approvalWorkflow];

  if (!allowedRoles) {
    return { allowed: false, reason: 'Invalid timesheet status for rejection' };
  }

  if (!allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `You don't have permission to reject at ${currentStatus} stage. Required roles: ${allowedRoles.join(', ')}`
    };
  }

  return { allowed: true };
}

// Helper function to get next approval status
function getNextApprovalStatus(currentStatus: string, userRole: string) {
  const statusProgression = {
    submitted: 'foreman_approved',
    foreman_approved: 'incharge_approved',
    incharge_approved: 'checking_approved',
    checking_approved: 'manager_approved'
  };

  return statusProgression[currentStatus as keyof typeof statusProgression] || currentStatus;
}

// Helper function to get approval field name
function getApprovalField(currentStatus: string, userRole: string) {
  const approvalFields = {
    submitted: 'foremanApprovalBy',
    foreman_approved: 'timesheetInchargeApprovalBy',
    incharge_approved: 'timesheetCheckingApprovalBy',
    checking_approved: 'managerApprovalBy'
  };

  return approvalFields[currentStatus as keyof typeof approvalFields];
}

// Helper function to get approval time field name
function getApprovalTimeField(currentStatus: string, userRole: string) {
  const approvalTimeFields = {
    submitted: 'foremanApprovalAt',
    foreman_approved: 'timesheetInchargeApprovalAt',
    incharge_approved: 'timesheetCheckingApprovalAt',
    checking_approved: 'managerApprovalAt'
  };

  return approvalTimeFields[currentStatus as keyof typeof approvalTimeFields];
}
