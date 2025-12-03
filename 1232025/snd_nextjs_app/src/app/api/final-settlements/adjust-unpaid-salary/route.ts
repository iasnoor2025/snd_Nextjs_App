import { NextRequest, NextResponse } from 'next/server';
import { FinalSettlementService } from '@/lib/services/final-settlement-service';

export async function POST(request: NextRequest) {
  try {
    const { employeeId, lastPaidUpToMonth, lastPaidUpToYear, adjustmentReason } = await request.json();

    // Validate required fields
    if (!employeeId || !lastPaidUpToMonth || !lastPaidUpToYear || !adjustmentReason) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the current unpaid salary info
    const unpaidSalaryInfo = await FinalSettlementService.getUnpaidSalaryInfo(employeeId);

    // Adjust the unpaid salary info
    const adjustedInfo = FinalSettlementService.adjustUnpaidSalaryInfo(
      unpaidSalaryInfo,
      lastPaidUpToMonth,
      lastPaidUpToYear,
      adjustmentReason
    );

    return NextResponse.json({
      success: true,
      data: adjustedInfo,
    });
  } catch (error) {
    console.error('Error adjusting unpaid salary:', error);
    return NextResponse.json(
      { success: false, message: 'Error adjusting unpaid salary' },
      { status: 500 }
    );
  }
}
