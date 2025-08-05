import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';

// Helper function to get the appropriate permission for approval stage
function getAssignmentApprovalPermission(approvalStage: string): string {
  switch (approvalStage) {
    case 'manager':
      return 'approve.assignment.manager';
    case 'hr':
      return 'approve.assignment.hr';
    default:
      return 'approve.assignment';
  }
}

// POST /api/assignments/approve - Approve assignment at specific stage
export const POST = withPermission(
  async (request: NextRequest) => {
    try {
      const { assignmentId, approvalStage, notes } = await request.json();

      // Get the assignment
      const assignment = await prisma.employeeAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          employee: {
            include: {
              user: true
            }
          },
          project: true
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      // Validate approval stage
      const validStages = ['manager', 'hr'];
      if (!validStages.includes(approvalStage)) {
        return NextResponse.json({ error: 'Invalid approval stage' }, { status: 400 });
      }

      // Check if assignment can be approved at this stage
      let canApprove = false;
      let newStatus = '';

      switch (approvalStage) {
        case 'manager':
          canApprove = assignment.status === 'pending';
          newStatus = 'manager_approved';
          break;
        case 'hr':
          canApprove = assignment.status === 'manager_approved';
          newStatus = 'hr_approved';
          break;
      }

      if (!canApprove) {
        return NextResponse.json({
          error: `Assignment cannot be approved at ${approvalStage} stage. Current status: ${assignment.status}`
        }, { status: 400 });
      }

      // Update assignment with approval
      const updateData: any = {
        status: newStatus
      };

      switch (approvalStage) {
        case 'manager':
          updateData.managerApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.managerApprovalAt = new Date();
          updateData.managerApprovalNotes = notes;
          break;
        case 'hr':
          updateData.hrApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.hrApprovalAt = new Date();
          updateData.hrApprovalNotes = notes;
          break;
      }

      const updatedAssignment = await prisma.employeeAssignment.update({
        where: { id: assignmentId },
        data: updateData,
        include: {
          employee: {
            include: {
              user: true
            }
          },
          project: true
        }
      });

      return NextResponse.json({
        message: `Assignment approved at ${approvalStage} stage`,
        assignment: updatedAssignment
      });

    } catch (error) {
      console.error('Error approving assignment:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    action: 'approve',
    subject: 'Assignment'
  }
); 