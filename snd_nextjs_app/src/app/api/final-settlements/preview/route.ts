import { NextRequest, NextResponse } from 'next/server';
import { FinalSettlementService } from '@/lib/services/final-settlement-service';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';

// POST: Generate preview for final settlement calculation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      employeeId,
      lastWorkingDate,
      isResignation = false,
    } = body;

    if (!employeeId || !lastWorkingDate) {
      return NextResponse.json({ 
        error: 'Employee ID and last working date are required' 
      }, { status: 400 });
    }

    // Generate settlement preview data
    const settlementData = await FinalSettlementService.generateFinalSettlementData(
      employeeId,
      lastWorkingDate,
      isResignation
    );

    return NextResponse.json({
      success: true,
      data: settlementData,
    });
  } catch (error) {
    console.error('Error generating settlement preview:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate settlement preview',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
