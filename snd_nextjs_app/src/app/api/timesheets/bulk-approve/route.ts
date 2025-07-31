import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 BULK APPROVE - Starting request');
    console.log('🔍 BULK APPROVE - ==========================================');
    console.log('🔍 BULK APPROVE - BULK APPROVE API CALLED!');
    console.log('🔍 BULK APPROVE - ==========================================');
    console.log('🔍 BULK APPROVE - Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Try to get session using getServerSession
    let session = await getServerSession(authConfig);
    console.log('🔍 BULK APPROVE - Session from getServerSession:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : []
    });
    
    // If no session, try to get token directly
    if (!session) {
      console.log('🔍 BULK APPROVE - No session from getServerSession, trying getToken...');
      const { getToken } = await import('next-auth/jwt');
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      console.log('🔍 BULK APPROVE - Token from getToken:', token);
      
      if (token) {
        session = {
          user: {
            id: (token.id as string) || (token.sub as string) || '',
            email: (token.email as string) || '',
            role: (token.role as string) || 'USER',
            isActive: (token.isActive as boolean) || true
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        console.log('🔍 BULK APPROVE - Created session from token:', session);
      }
    }
    
    if (!session?.user?.id) {
      console.log('🔍 BULK APPROVE - No session or user ID');
      console.log('🔍 BULK APPROVE - Session object:', session);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Check user permissions
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { employees: true }
    });

    console.log('🔍 BULK APPROVE - User found:', {
      userId: user?.id,
      userRole: user?.role_id,
      userEmail: user?.email
    });

    if (!user) {
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
            
            // For SUPER_ADMIN, ADMIN, MANAGER - allow direct approval of draft timesheets
            if (['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
              try {
                // Approve the draft timesheet directly (skip submission step)
                const updatedTimesheet = await (prisma.timesheet as any).update({
                  where: { id: timesheetId },
                  data: {
                    status: 'foreman_approved', // Move directly to approved
                    approved_by: parseInt(session.user.id),
                    approved_at: new Date(),
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

                console.log(`🔍 BULK APPROVE - Draft timesheet approved directly: ${timesheetId}`);
                results.approved.push(updatedTimesheet);
                continue;
              } catch (error) {
                console.error(`🔍 BULK APPROVE - Error approving draft timesheet ${timesheetId}:`, error);
                results.errors.push({
                  timesheetId: timesheetId as string,
                  error: `Failed to approve draft timesheet: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
                continue;
              }
            } else {
              // For other roles, check submission permissions
              const canSubmit = await checkSubmissionPermission(session.user.id, timesheet.employeeId, session.user.role);

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
          }

          // Special handling for pending timesheets - treat them as submitted
          if (timesheet.status === 'pending') {
            console.log(`🔍 BULK APPROVE - Processing pending timesheet: ${timesheetId}`);
            
            try {
              // Approve the pending timesheet directly (treat as submitted)
              const updatedTimesheet = await (prisma.timesheet as any).update({
                where: { id: timesheetId },
                data: {
                  status: 'foreman_approved', // Move to next stage
                  approvedBy: parseInt(session.user.id),
                  approvedAt: new Date(),
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

              console.log(`🔍 BULK APPROVE - Pending timesheet approved successfully: ${timesheetId}`);
              results.approved.push(updatedTimesheet);
              continue;
            } catch (error) {
              console.error(`🔍 BULK APPROVE - Error approving pending timesheet ${timesheetId}:`, error);
              results.errors.push({
                timesheetId: timesheetId as string,
                error: `Failed to approve pending timesheet: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
              continue;
            }
          }

          // Check if user can approve at this stage based on their role
          console.log(`🔍 BULK APPROVE - Checking approval permission for timesheet ${timesheetId}:`, {
            userRole: session.user.role,
            timesheetStatus: timesheet.status
          });
          
          const canApprove = await checkApprovalPermission(session.user.role, timesheet.status);

          if (!canApprove.allowed) {
            console.log(`🔍 BULK APPROVE - Approval permission denied: ${canApprove.reason}`);
            results.errors.push({
              timesheetId,
              error: canApprove.reason || 'Unknown error'
            });
            continue;
          }

          console.log(`🔍 BULK APPROVE - Approval permission granted for timesheet ${timesheetId}`);

          // Check if timesheet is in a state that can be approved
          const canProcess = ['submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);

          if (!canProcess) {
            console.log(`🔍 BULK APPROVE - Timesheet cannot be approved. Status: ${timesheet.status}`);
            results.errors.push({
              timesheetId,
              error: `Timesheet cannot be approved. Current status: ${timesheet.status}`
            });
            continue;
          }

          try {
            // Determine the next status based on current status and user role
            const nextStatus = getNextApprovalStatus(timesheet.status, session.user.role);
            const approvalField = getApprovalField(timesheet.status, session.user.role);
            const approvalTimeField = getApprovalTimeField(timesheet.status, session.user.role);

            console.log(`🔍 BULK APPROVE - Approval details:`, {
              currentStatus: timesheet.status,
              nextStatus,
              approvalField,
              approvalTimeField,
              userRole: session.user.role
            });

            // Update the timesheet
            const updateData: any = {
              status: nextStatus,
              notes: notes || timesheet.notes
            };

            if (approvalField) {
              updateData[approvalField] = parseInt(session.user.id);
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

            console.log(`🔍 BULK APPROVE - Timesheet approved successfully: ${timesheetId} -> ${nextStatus}`);
            results.approved.push(updatedTimesheet);
          } catch (error) {
            console.error(`🔍 BULK APPROVE - Error approving timesheet ${timesheetId}:`, error);
            results.errors.push({
              timesheetId,
              error: `Failed to approve timesheet: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
            continue;
          }

        } else if (action === 'reject') {
          // Check if user can reject at this stage
          const canReject = await checkRejectionPermission(session.user.role, timesheet.status);

          if (!canReject.allowed) {
            results.errors.push({
              timesheetId,
              error: canReject.reason || 'Unknown error'
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
}

// Helper function to check if user can approve at current stage
async function checkApprovalPermission(userRole: string, currentStatus: string) {
  console.log('🔍 CHECK APPROVAL - Checking permission:', { userRole, currentStatus });
  
  // Define approval workflow stages and who can approve at each stage
  // Include 'pending' as equivalent to 'submitted' for approval purposes
  const approvalWorkflow = {
    pending: ['FOREMAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    submitted: ['FOREMAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    foreman_approved: ['INCHARGE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    incharge_approved: ['CHECKING', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    checking_approved: ['MANAGER', 'ADMIN', 'SUPER_ADMIN']
  };

  const allowedRoles = approvalWorkflow[currentStatus as keyof typeof approvalWorkflow];
  console.log('🔍 CHECK APPROVAL - Allowed roles:', allowedRoles);

  if (!allowedRoles) {
    console.log('🔍 CHECK APPROVAL - Invalid status for approval');
    return { allowed: false, reason: 'Invalid timesheet status for approval' };
  }

  if (!allowedRoles.includes(userRole)) {
    console.log('🔍 CHECK APPROVAL - Role not allowed:', { userRole, allowedRoles });
    return {
      allowed: false,
      reason: `You don't have permission to approve at ${currentStatus} stage. Required roles: ${allowedRoles.join(', ')}`
    };
  }

  console.log('🔍 CHECK APPROVAL - Permission granted');
  return { allowed: true };
}

// Helper function to check if user can submit timesheets
async function checkSubmissionPermission(userId: string, employeeId: string, userRole: string) {
  console.log('🔍 CHECK SUBMISSION - Checking permission:', { userId, employeeId, userRole });
  
  // Admin, Manager, and SUPER_ADMIN can submit any timesheet
  if (userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPER_ADMIN') {
    console.log('🔍 CHECK SUBMISSION - Admin/Manager/Super_Admin permission granted');
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
    reason: 'You can only submit your own timesheets or have admin/manager/super_admin permissions'
  };
}

// Helper function to check if user can reject at current stage
async function checkRejectionPermission(userRole: string, currentStatus: string) {
  // Any role that can approve can also reject
  // Include 'pending' as equivalent to 'submitted' for rejection purposes
  const approvalWorkflow = {
    pending: ['FOREMAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    submitted: ['FOREMAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    foreman_approved: ['INCHARGE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    incharge_approved: ['CHECKING', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    checking_approved: ['MANAGER', 'ADMIN', 'SUPER_ADMIN']
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
    pending: 'foreman_approved', // Treat pending as submitted
    submitted: 'foreman_approved',
    foreman_approved: 'incharge_approved',
    incharge_approved: 'checking_approved',
    checking_approved: 'manager_approved'
  };

  return statusProgression[currentStatus as keyof typeof statusProgression] || currentStatus;
}

// Helper function to get approval field name
function getApprovalField(currentStatus: string, userRole: string) {
  // The database only has approved_by field, so we'll use that for all approvals
  return 'approved_by';
}

// Helper function to get approval time field name
function getApprovalTimeField(currentStatus: string, userRole: string) {
  // The database only has approved_at field, so we'll use that for all approvals
  return 'approved_at';
}
