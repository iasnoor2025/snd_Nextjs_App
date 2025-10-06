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
      settlementType = 'exit',
      lastWorkingDate,
      isResignation = false,
      vacationStartDate,
      vacationEndDate,
      expectedReturnDate,
      vacationDurationMonths,
      manualUnpaidSalary = 0,
      overtimeHours = 0,
      overtimeAmount = 0,
      manualVacationAllowance = 0,
      absentCalculationPeriod = 'last_month',
      absentCalculationStartDate,
      absentCalculationEndDate,
      manualAbsentDays = 0,
    } = body;

    if (!employeeId) {
      return NextResponse.json({ 
        error: 'Employee ID is required' 
      }, { status: 400 });
    }

    let settlementData;

    if (settlementType === 'vacation') {
      // Validate vacation settlement fields
      if (!vacationStartDate || !vacationEndDate || !expectedReturnDate) {
        return NextResponse.json({ 
          error: 'Vacation dates are required for vacation settlements' 
        }, { status: 400 });
      }

      // Generate vacation settlement preview data
      settlementData = await FinalSettlementService.generateVacationSettlementData(
        employeeId,
        vacationStartDate,
        vacationEndDate,
        expectedReturnDate,
        {
          vacationDurationMonths,
          manualUnpaidSalary,
          overtimeHours,
          overtimeAmount,
          manualVacationAllowance,
          absentCalculationPeriod,
          absentCalculationStartDate,
          absentCalculationEndDate,
          manualAbsentDays,
        }
      );
    } else {
      // Validate exit settlement fields
      if (!lastWorkingDate) {
        return NextResponse.json({ 
          error: 'Last working date is required for exit settlements' 
        }, { status: 400 });
      }

      // Generate exit settlement preview data
      settlementData = await FinalSettlementService.generateFinalSettlementData(
        employeeId,
        lastWorkingDate,
        isResignation,
        {
          manualUnpaidSalary,
          overtimeHours,
          overtimeAmount,
          absentCalculationPeriod,
          absentCalculationStartDate,
          absentCalculationEndDate,
          manualAbsentDays,
        }
      );
    }

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
