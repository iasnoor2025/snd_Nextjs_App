import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { finalSettlements, employees, users } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { FinalSettlementService } from '@/lib/services/final-settlement-service';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';

// GET: Fetch final settlements for a specific employee
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

    // Fetch all final settlements for this employee
    const settlements = await db
      .select({
        id: finalSettlements.id,
        settlementNumber: finalSettlements.settlementNumber,
        settlementType: finalSettlements.settlementType,
        employeeName: finalSettlements.employeeName,
        fileNumber: finalSettlements.fileNumber,
        hireDate: finalSettlements.hireDate,
        lastWorkingDate: finalSettlements.lastWorkingDate,
        vacationStartDate: finalSettlements.vacationStartDate,
        vacationEndDate: finalSettlements.vacationEndDate,
        expectedReturnDate: finalSettlements.expectedReturnDate,
        vacationDays: finalSettlements.vacationDays,
        totalServiceYears: finalSettlements.totalServiceYears,
        totalServiceMonths: finalSettlements.totalServiceMonths,
        totalServiceDays: finalSettlements.totalServiceDays,
        unpaidSalaryMonths: finalSettlements.unpaidSalaryMonths,
        unpaidSalaryAmount: finalSettlements.unpaidSalaryAmount,
        endOfServiceBenefit: finalSettlements.endOfServiceBenefit,
        accruedVacationDays: finalSettlements.accruedVacationDays,
        accruedVacationAmount: finalSettlements.accruedVacationAmount,
        overtimeHours: finalSettlements.overtimeHours,
        overtimeAmount: finalSettlements.overtimeAmount,
        otherBenefits: finalSettlements.otherBenefits,
        otherBenefitsDescription: finalSettlements.otherBenefitsDescription,
        pendingAdvances: finalSettlements.pendingAdvances,
        equipmentDeductions: finalSettlements.equipmentDeductions,
        otherDeductions: finalSettlements.otherDeductions,
        otherDeductionsDescription: finalSettlements.otherDeductionsDescription,
        grossAmount: finalSettlements.grossAmount,
        totalDeductions: finalSettlements.totalDeductions,
        netAmount: finalSettlements.netAmount,
        status: finalSettlements.status,
        preparedAt: finalSettlements.preparedAt,
        approvedAt: finalSettlements.approvedAt,
        paidAt: finalSettlements.paidAt,
        currency: finalSettlements.currency,
        createdAt: finalSettlements.createdAt,
      })
      .from(finalSettlements)
      .where(eq(finalSettlements.employeeId, employeeId))
      .orderBy(desc(finalSettlements.createdAt));

    return NextResponse.json({
      success: true,
      data: settlements,
    });
  } catch (error) {
    console.error('Error fetching final settlements:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch final settlements',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new final settlement for a specific employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      settlementType = 'exit', // 'vacation' or 'exit'
      lastWorkingDate,
      isResignation = false,
      resignationId,
      // Vacation specific fields
      vacationStartDate,
      vacationEndDate,
      expectedReturnDate,
      vacationDurationMonths,
      manualVacationAllowance = 0,
      // Common fields
      manualUnpaidSalary = 0, // Manual unpaid salary override
      overtimeHours = 0, // Overtime hours
      overtimeAmount = 0, // Manual overtime amount override
      accruedVacationDays = 0,
      otherBenefits = 0,
      otherBenefitsDescription,
      pendingAdvances = 0,
      equipmentDeductions = 0,
      otherDeductions = 0,
      otherDeductionsDescription,
      // Absent calculation fields
      absentCalculationPeriod = 'last_month',
      absentCalculationStartDate,
      absentCalculationEndDate,
      manualAbsentDays = 0,
      notes,
    } = body;

    // Verify employee exists
    const employee = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!employee.length) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    let settlementData;

    if (settlementType === 'vacation') {
      // Validate vacation specific fields
      if (!vacationStartDate || !vacationEndDate || !expectedReturnDate) {
        return NextResponse.json({ 
          error: 'Vacation dates are required for vacation settlements' 
        }, { status: 400 });
      }

        // Generate vacation settlement data
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
            otherBenefits,
            otherBenefitsDescription,
            pendingAdvances,
            equipmentDeductions,
            otherDeductions,
            otherDeductionsDescription,
            absentCalculationPeriod,
            absentCalculationStartDate,
            absentCalculationEndDate,
            manualAbsentDays,
          }
        );
    } else {
      // Exit settlement
      if (!lastWorkingDate) {
        return NextResponse.json({ error: 'Last working date is required' }, { status: 400 });
      }

      // Generate exit settlement data
      settlementData = await FinalSettlementService.generateFinalSettlementData(
        employeeId,
        lastWorkingDate,
        isResignation,
        {
          manualUnpaidSalary,
          overtimeHours,
          overtimeAmount,
          accruedVacationDays,
          otherBenefits,
          otherBenefitsDescription,
          pendingAdvances,
          equipmentDeductions,
          otherDeductions,
          otherDeductionsDescription,
          absentCalculationPeriod,
          absentCalculationStartDate,
          absentCalculationEndDate,
          manualAbsentDays,
        }
      );
    }

    // Create the settlement record
    const newSettlement = await FinalSettlementService.createFinalSettlement(
      settlementData,
      session.user.id,
      resignationId,
      {
        vacationDurationMonths: settlementType === 'vacation' ? vacationDurationMonths : undefined,
        overtimeHours,
        overtimeAmount,
        otherBenefitsDescription,
        otherDeductionsDescription,
        notes,
      }
    );

    return NextResponse.json({
      success: true,
      message: `${settlementType === 'vacation' ? 'Vacation' : 'Final'} settlement created successfully`,
      data: {
        settlement: newSettlement,
        calculationDetails: settlementData,
      },
    });
  } catch (error) {
    console.error('Error creating final settlement:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create final settlement',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
