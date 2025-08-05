import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';

// Helper function to check if user can approve at current stage
async function checkApprovalPermission(userId: string, currentStatus: string) {
  console.log('🔍 CHECK APPROVAL - Checking permission:', { userId, currentStatus });
  
  // Check if user has general timesheet approval permission
  const generalResult = await checkUserPermission(userId, 'approve', 'Timesheet');
  if (generalResult.hasPermission) {
    console.log('🔍 CHECK APPROVAL - General approval permission granted');
    return { allowed: true };
  }

  console.log('🔍 CHECK APPROVAL - No permission');
  return {
    allowed: false,
    reason: `You don't have permission to approve timesheets`
  };
}

// Helper function to check if user can submit timesheets
async function checkSubmissionPermission(userId: string, employeeId: string) {
  console.log('🔍 CHECK SUBMISSION - Checking permission:', { userId, employeeId });
  
  // Check if user has general timesheet submission permission
  const result = await checkUserPermission(userId, 'create', 'Timesheet');
  if (result.hasPermission) {
    console.log('🔍 CHECK SUBMISSION - General submission permission granted');
    return { allowed: true };
  }

  // Check if user is the employee (can submit their own timesheets)
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: { employees: true }
  });

  if (!user) {
    console.log('🔍 CHECK SUBMISSION - User not found');
    return { allowed: false, reason: 'User not found' };
  }

  const userEmployeeIds = user.employees.map(emp => emp.id);
  console.log('🔍 CHECK SUBMISSION - User employee IDs:', userEmployeeIds);
  
  if (userEmployeeIds.includes(parseInt(employeeId))) {
    console.log('🔍 CHECK SUBMISSION - Own timesheet permission granted');
    return { allowed: true };
  }

  console.log('🔍 CHECK SUBMISSION - No permission');
  return {
    allowed: false,
    reason: 'You can only submit your own timesheets or have appropriate permissions'
  };
}

// Helper function to check if user can reject at current stage
async function checkRejectionPermission(userId: string, currentStatus: string) {
  // Check if user has general timesheet rejection permission
  const generalResult = await checkUserPermission(userId, 'reject', 'Timesheet');
  if (generalResult.hasPermission) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `You don't have permission to reject timesheets`
  };
}

function getNextApprovalStatus(currentStatus: string) {
  switch (currentStatus) {
    case 'pending':
    case 'submitted':
      return 'foreman_approved';
    case 'foreman_approved':
      return 'incharge_approved';
    case 'incharge_approved':
      return 'checking_approved';
    case 'checking_approved':
      return 'manager_approved';
    default:
      return currentStatus;
  }
}

function getApprovalField(currentStatus: string) {
  switch (currentStatus) {
    case 'pending':
    case 'submitted':
      return 'foremanApprovedBy';
    case 'foreman_approved':
      return 'inchargeApprovedBy';
    case 'incharge_approved':
      return 'checkingApprovedBy';
    case 'checking_approved':
      return 'managerApprovedBy';
    default:
      return null;
  }
}

function getApprovalTimeField(currentStatus: string) {
  // The database only has approved_at field, so we'll use that for all approvals
  return 'approved_at';
}

// POST /api/timesheets/bulk-approve - Bulk approve/reject timesheets
export const POST = withPermission(
  async (request: NextRequest) => {
    try {
      console.log('🔍 BULK APPROVE - Starting request');
      
      const body = await request.json();
      console.log('🔍 BULK APPROVE - Raw request body:', body);
      const { timesheetIds, action, notes } = body;
      console.log('🔍 BULK APPROVE - Parsed request data:', { timesheetIds, action, notes });

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

      // Get user ID from request headers (set by middleware)
      const userId = request.headers.get('user-id');
      if (!userId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const results: {
        approved: any[];
        rejected: any[];
        errors: { timesheetId: string; error: string }[];
      } = {
        approved: [],
        rejected: [],
        errors: []
      };

      for (const timesheetId of timesheetIds) {
        try {
          // Get the timesheet
          const timesheet = await (prisma.timesheet as any).findUnique({
            where: { id: parseInt(timesheetId) },
            include: {
              employee: {
                include: {
                  user: true
                }
              }
            }
          });

          if (!timesheet) {
            console.log(`🔍 BULK APPROVE - Timesheet not found: ${timesheetId}`);
            results.errors.push({
              timesheetId: timesheetId as string, 
              error: 'Timesheet not found' 
            });
            continue;
          }

          console.log(`🔍 BULK APPROVE - Processing timesheet:`, {
            id: timesheet.id,
            status: timesheet.status,
            employeeId: timesheet.employeeId,
            employeeName: timesheet.employee?.firstName + ' ' + timesheet.employee?.lastName,
            canProcess: ['pending', 'draft', 'submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status)
          });

          if (action === 'approve') {
            // Special handling for draft timesheets - they need to be submitted first
            if (timesheet.status === 'draft') {
              console.log(`🔍 BULK APPROVE - Processing draft timesheet: ${timesheetId}`);
              
              // Check if user has permission to submit timesheets
              const canSubmit = await checkSubmissionPermission(userId, timesheet.employeeId);

              if (!canSubmit.allowed) { 
                console.log(`🔍 BULK APPROVE - Submission permission denied: ${canSubmit.reason}`);
                results.errors.push({
                  timesheetId: timesheetId as string, 
                  error: canSubmit.reason || 'Unknown error'
                });
                continue;
              }

              try {
                // Submit the draft timesheet
                const updatedTimesheet = await (prisma.timesheet as any).update({
                  where: { id: parseInt(timesheetId) },
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

                console.log(`🔍 BULK APPROVE - Draft timesheet submitted successfully: ${timesheetId}`);
                results.approved.push(updatedTimesheet);
                continue;
              } catch (error) {
                console.error(`🔍 BULK APPROVE - Error submitting draft timesheet ${timesheetId}:`, error);
                results.errors.push({
                  timesheetId: timesheetId as string,
                  error: `Failed to submit draft timesheet: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
                continue;
              }
            }

            // Special handling for pending timesheets - treat them as submitted
            if (timesheet.status === 'pending') {
              console.log(`🔍 BULK APPROVE - Processing pending timesheet: ${timesheetId}`);
              
              try {
                // Update pending timesheet to submitted
                const updatedTimesheet = await (prisma.timesheet as any).update({
                  where: { id: parseInt(timesheetId) },
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

                console.log(`🔍 BULK APPROVE - Pending timesheet submitted successfully: ${timesheetId}`);
                results.approved.push(updatedTimesheet);
                continue;
              } catch (error) {
                console.error(`🔍 BULK APPROVE - Error submitting pending timesheet ${timesheetId}:`, error);
                results.errors.push({
                  timesheetId: timesheetId as string,
                  error: `Failed to submit pending timesheet: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
                continue;
              }
            }

            // Check if user can approve at this stage
            const canApprove = await checkApprovalPermission(userId, timesheet.status);

            if (!canApprove.allowed) {
              console.log(`🔍 BULK APPROVE - Approval permission denied: ${canApprove.reason}`);
              results.errors.push({
                timesheetId: timesheetId as string,
                error: canApprove.reason || 'Unknown error'
              });
              continue;
            }

            // Check if timesheet can be approved
            const canProcess = ['submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);

            if (!canProcess) {
              results.errors.push({
                timesheetId: timesheetId as string,
                error: `Timesheet cannot be approved. Current status: ${timesheet.status}`
              });
              continue;
            }

            // Approve the timesheet
            const nextStatus = getNextApprovalStatus(timesheet.status);
            const approvalField = getApprovalField(timesheet.status);
            const approvalTimeField = getApprovalTimeField(timesheet.status);

            const updateData: any = {
              status: nextStatus,
              notes: notes || timesheet.notes
            };

            if (approvalField) {
              updateData[approvalField] = parseInt(userId);
            }
            if (approvalTimeField) {
              updateData[approvalTimeField] = new Date();
            }

            const updatedTimesheet = await (prisma.timesheet as any).update({
              where: { id: parseInt(timesheetId) },
              data: updateData,
              include: {
                employee: {
                  include: {
                    user: true
                  }
                }
              }
            });

            console.log(`🔍 BULK APPROVE - Timesheet approved successfully: ${timesheetId} -> ${nextStatus}`);
            results.approved.push(updatedTimesheet);
          } else if (action === 'reject') {
            // Check if user can reject at this stage
            const canReject = await checkRejectionPermission(userId, timesheet.status);

            if (!canReject.allowed) {
              results.errors.push({
                timesheetId: timesheetId as string,
                error: canReject.reason || 'Unknown error'
              });
              continue;
            }

            // Check if timesheet can be rejected
            const canProcess = ['submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);

            if (!canProcess) {
              results.errors.push({
                timesheetId: timesheetId as string,
                error: `Timesheet cannot be rejected. Current status: ${timesheet.status}`
              });
              continue;
            }

            // Reject the timesheet
            const updatedTimesheet = await (prisma.timesheet as any).update({
              where: { id: parseInt(timesheetId) },
              data: {
                status: 'rejected',
                rejectedBy: parseInt(userId),
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
            timesheetId: timesheetId as string,
            error: 'Failed to process timesheet'
          });
        }
      }

      console.log('🔍 BULK APPROVE - Final results:', results);
      console.log('🔍 BULK APPROVE - ==========================================');
      console.log('🔍 BULK APPROVE - API COMPLETED SUCCESSFULLY');
      console.log('🔍 BULK APPROVE - ==========================================');
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
  },
  {
    action: 'approve',
    subject: 'Timesheet'
  }
);  