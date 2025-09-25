import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { finalSettlements, employees, users } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { FinalSettlementService } from '@/lib/services/final-settlement-service';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';

// GET: Fetch final settlements for a specific employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = parseInt(params.id);
    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Fetch all final settlements for this employee
    const settlements = await db
      .select({
        id: finalSettlements.id,
        settlementNumber: finalSettlements.settlementNumber,
        employeeName: finalSettlements.employeeName,
        fileNumber: finalSettlements.fileNumber,
        hireDate: finalSettlements.hireDate,
        lastWorkingDate: finalSettlements.lastWorkingDate,
        totalServiceYears: finalSettlements.totalServiceYears,
        totalServiceMonths: finalSettlements.totalServiceMonths,
        unpaidSalaryMonths: finalSettlements.unpaidSalaryMonths,
        unpaidSalaryAmount: finalSettlements.unpaidSalaryAmount,
        endOfServiceBenefit: finalSettlements.endOfServiceBenefit,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = parseInt(params.id);
    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      lastWorkingDate,
      isResignation = false,
      resignationId,
      accruedVacationDays = 0,
      otherBenefits = 0,
      otherBenefitsDescription,
      pendingAdvances = 0,
      equipmentDeductions = 0,
      otherDeductions = 0,
      otherDeductionsDescription,
      notes,
    } = body;

    if (!lastWorkingDate) {
      return NextResponse.json({ error: 'Last working date is required' }, { status: 400 });
    }

    // Verify employee exists
    const employee = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!employee.length) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Generate final settlement data
    const settlementData = await FinalSettlementService.generateFinalSettlementData(
      employeeId,
      lastWorkingDate,
      isResignation,
      {
        accruedVacationDays,
        otherBenefits,
        otherBenefitsDescription,
        pendingAdvances,
        equipmentDeductions,
        otherDeductions,
        otherDeductionsDescription,
      }
    );

    // Create the final settlement record
    const newSettlement = await FinalSettlementService.createFinalSettlement(
      settlementData,
      session.user.id,
      resignationId,
      {
        otherBenefitsDescription,
        otherDeductionsDescription,
        notes,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Final settlement created successfully',
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
