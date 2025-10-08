import { NextRequest, NextResponse } from 'next/server';
import { FinalSettlementService } from '@/lib/services/final-settlement-service';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';

// Always compute on request; do not cache
export const dynamic = 'force-dynamic';

// GET: Get unpaid salary information for a specific employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Get unpaid salary information
    const unpaidSalaryInfo = await FinalSettlementService.getUnpaidSalaryInfo(employeeId);

    return NextResponse.json({
      success: true,
      data: unpaidSalaryInfo,
    }, {
      // Disable caching so the UI reflects newly applied adjustments immediately
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching unpaid salary info:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch unpaid salary information',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
