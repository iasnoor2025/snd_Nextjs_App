import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission } from '@/lib/rbac/api-middleware';
import { checkUserPermission } from '@/lib/rbac/permission-service';

// Helper function to get the appropriate permission for approval stage
function getAdvanceApprovalPermission(approvalStage: string): string {
  switch (approvalStage) {
    case 'manager':
      return 'approve.advance.manager';
    case 'hr':
      return 'approve.advance.hr';
    case 'finance':
      return 'approve.advance.finance';
    default:
      return 'approve.advance';
  }
}

// POST /api/advances/approve - Approve advance at specific stage
export const POST = withPermission(
  async (request: NextRequest) => {
    try {
      const { advanceId, approvalStage, notes } = await request.json();

      // Get the advance
      const advance = await prisma.advancePayment.findUnique({
        where: { id: advanceId },
        include: {
          employee: {
            include: {
              user: true
            }
          }
        }
      });

      if (!advance) {
        return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
      }

      // Validate approval stage
      const validStages = ['manager', 'hr', 'finance'];
      if (!validStages.includes(approvalStage)) {
        return NextResponse.json({ error: 'Invalid approval stage' }, { status: 400 });
      }

      // Check if advance can be approved at this stage
      let canApprove = false;
      let newStatus = '';

      switch (approvalStage) {
        case 'manager':
          canApprove = advance.status === 'pending';
          newStatus = 'manager_approved';
          break;
        case 'hr':
          canApprove = advance.status === 'manager_approved';
          newStatus = 'hr_approved';
          break;
        case 'finance':
          canApprove = advance.status === 'hr_approved';
          newStatus = 'finance_approved';
          break;
      }

      if (!canApprove) {
        return NextResponse.json({
          error: `Advance cannot be approved at ${approvalStage} stage. Current status: ${advance.status}`
        }, { status: 400 });
      }

      // Update advance with approval
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
        case 'finance':
          updateData.financeApprovalBy = parseInt(request.headers.get('user-id') || '0');
          updateData.financeApprovalAt = new Date();
          updateData.financeApprovalNotes = notes;
          break;
      }

      const updatedAdvance = await prisma.advancePayment.update({
        where: { id: advanceId },
        data: updateData,
        include: {
          employee: {
            include: {
              user: true
            }
          }
        }
      });

      return NextResponse.json({
        message: `Advance approved at ${approvalStage} stage`,
        advance: updatedAdvance
      });

    } catch (error) {
      console.error('Error approving advance:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    action: 'approve',
    subject: 'Advance'
  }
); 