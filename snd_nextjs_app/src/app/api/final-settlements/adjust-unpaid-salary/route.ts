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

    // Adjust the unpaid salary info based on manual adjustment
    // Calculate months from the adjusted "last paid" date to today
    const lastPaidDate = new Date(lastPaidUpToYear, lastPaidUpToMonth - 1, 1);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - lastPaidDate.getFullYear()) * 12 + 
                       (today.getMonth() - lastPaidDate.getMonth());
    
    // Calculate monthly salary from unpaid amount and months
    const monthlySalary = unpaidSalaryInfo.unpaidMonths > 0 
      ? unpaidSalaryInfo.unpaidAmount / unpaidSalaryInfo.unpaidMonths 
      : 0;
    
    const adjustedInfo = {
      ...unpaidSalaryInfo,
      unpaidMonths: Math.max(0, monthsDiff),
      unpaidAmount: monthlySalary * Math.max(0, monthsDiff),
      lastPaidMonth: lastPaidUpToMonth,
      lastPaidYear: lastPaidUpToYear,
      lastPaidDate: lastPaidDate.toISOString().split('T')[0],
    };

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
