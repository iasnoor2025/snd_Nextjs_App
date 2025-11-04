import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { finalSettlements, employees, employeeLeaves, employeeAssignments } from '@/lib/drizzle/schema';
import { CentralAssignmentService } from '@/lib/services/central-assignment-service';
import { eq, and, or, lte, gte, like } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';


// GET: Fetch a specific final settlement by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settlementId = parseInt(params.id);
    if (!settlementId) {
      return NextResponse.json({ error: 'Invalid settlement ID' }, { status: 400 });
    }

    const settlement = await db
      .select()
      .from(finalSettlements)
      .where(eq(finalSettlements.id, settlementId))
      .limit(1);

    if (!settlement.length) {
      return NextResponse.json({ error: 'Final settlement not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: settlement[0],
    });
  } catch (error) {
    console.error('Error fetching final settlement:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch final settlement',
      },
      { status: 500 }
    );
  }
}

// PUT: Update a final settlement
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settlementId = parseInt(params.id);
    if (!settlementId) {
      return NextResponse.json({ error: 'Invalid settlement ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      status,
      notes,
      accruedVacationDays,
      accruedVacationAmount,
      otherBenefits,
      otherBenefitsDescription,
      pendingAdvances,
      equipmentDeductions,
      otherDeductions,
      otherDeductionsDescription,
      paymentMethod,
      paymentReference,
    } = body;

    // Check if settlement exists
    const existingSettlement = await db
      .select({ id: finalSettlements.id, status: finalSettlements.status })
      .from(finalSettlements)
      .where(eq(finalSettlements.id, settlementId))
      .limit(1);

    if (!existingSettlement.length) {
      return NextResponse.json({ error: 'Final settlement not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (notes !== undefined) updateData.notes = notes;
    if (accruedVacationDays !== undefined) updateData.accruedVacationDays = accruedVacationDays;
    if (accruedVacationAmount !== undefined) updateData.accruedVacationAmount = accruedVacationAmount.toString();
    if (otherBenefits !== undefined) updateData.otherBenefits = otherBenefits.toString();
    if (otherBenefitsDescription !== undefined) updateData.otherBenefitsDescription = otherBenefitsDescription;
    if (pendingAdvances !== undefined) updateData.pendingAdvances = pendingAdvances.toString();
    if (equipmentDeductions !== undefined) updateData.equipmentDeductions = equipmentDeductions.toString();
    if (otherDeductions !== undefined) updateData.otherDeductions = otherDeductions.toString();
    if (otherDeductionsDescription !== undefined) updateData.otherDeductionsDescription = otherDeductionsDescription;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (paymentReference !== undefined) updateData.paymentReference = paymentReference;

    // Handle status changes
    if (status !== undefined) {
      updateData.status = status;
      
      if (status === 'approved') {
        updateData.approvedBy = session.user.id;
        updateData.approvedAt = new Date().toISOString().split('T')[0];
      } else if (status === 'paid') {
        updateData.paidBy = session.user.id;
        updateData.paidAt = new Date().toISOString().split('T')[0];
      }
    }

    // Recalculate totals if any financial data changed
    if (accruedVacationAmount !== undefined || otherBenefits !== undefined || 
        pendingAdvances !== undefined || equipmentDeductions !== undefined || 
        otherDeductions !== undefined) {
      
      const current = await db
        .select({
          unpaidSalaryAmount: finalSettlements.unpaidSalaryAmount,
          endOfServiceBenefit: finalSettlements.endOfServiceBenefit,
          accruedVacationAmount: finalSettlements.accruedVacationAmount,
          otherBenefits: finalSettlements.otherBenefits,
          pendingAdvances: finalSettlements.pendingAdvances,
          equipmentDeductions: finalSettlements.equipmentDeductions,
          otherDeductions: finalSettlements.otherDeductions,
        })
        .from(finalSettlements)
        .where(eq(finalSettlements.id, settlementId))
        .limit(1);

      if (current.length > 0) {
        const currentData = current[0];
        
        const newUnpaidSalary = parseFloat(currentData.unpaidSalaryAmount);
        const newEndOfService = parseFloat(currentData.endOfServiceBenefit);
        const newAccruedVacation = parseFloat(updateData.accruedVacationAmount || currentData.accruedVacationAmount);
        const newOtherBenefits = parseFloat(updateData.otherBenefits || currentData.otherBenefits);
        const newPendingAdvances = parseFloat(updateData.pendingAdvances || currentData.pendingAdvances);
        const newEquipmentDeductions = parseFloat(updateData.equipmentDeductions || currentData.equipmentDeductions);
        const newOtherDeductions = parseFloat(updateData.otherDeductions || currentData.otherDeductions);

        const grossAmount = newUnpaidSalary + newEndOfService + newAccruedVacation + newOtherBenefits;
        const totalDeductions = newPendingAdvances + newEquipmentDeductions + newOtherDeductions;
        const netAmount = grossAmount - totalDeductions;

        updateData.grossAmount = grossAmount.toString();
        updateData.totalDeductions = totalDeductions.toString();
        updateData.netAmount = netAmount.toString();
      }
    }

    // Update the settlement
    const updatedSettlement = await db
      .update(finalSettlements)
      .set(updateData)
      .where(eq(finalSettlements.id, settlementId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Final settlement updated successfully',
      data: updatedSettlement[0],
    });
  } catch (error) {
    console.error('Error updating final settlement:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update final settlement',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a final settlement (only if status is draft)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settlementId = parseInt(params.id);
    if (!settlementId) {
      return NextResponse.json({ error: 'Invalid settlement ID' }, { status: 400 });
    }

    // Check if settlement exists and is in draft status
    const settlement = await db
      .select({
        id: finalSettlements.id,
        status: finalSettlements.status,
        employeeId: finalSettlements.employeeId,
        settlementType: finalSettlements.settlementType,
        vacationStartDate: finalSettlements.vacationStartDate,
        vacationEndDate: finalSettlements.vacationEndDate,
        settlementNumber: finalSettlements.settlementNumber,
      })
      .from(finalSettlements)
      .where(eq(finalSettlements.id, settlementId))
      .limit(1);

    if (!settlement.length) {
      return NextResponse.json({ error: 'Final settlement not found' }, { status: 404 });
    }

    if (settlement[0].status !== 'draft') {
      return NextResponse.json({ 
        error: 'Only draft settlements can be deleted' 
      }, { status: 400 });
    }

    // If vacation settlement, also delete matching Annual Leave
    const s = settlement[0];
    if (s.settlementType === 'vacation' && s.vacationStartDate && s.vacationEndDate) {
      await db
        .delete(employeeLeaves)
        .where(
          and(
            eq(employeeLeaves.employeeId, s.employeeId),
            eq(employeeLeaves.leaveType, 'Annual Leave'),
            or(
              like(employeeLeaves.reason, `%${s.settlementNumber}%`),
              and(
                lte(employeeLeaves.startDate, s.vacationEndDate),
                gte(employeeLeaves.endDate, s.vacationStartDate)
              )
            )
          )
        );

      // Restore assignments that were completed for this vacation settlement using central service
      console.log(`[Final Settlement] Restoring assignments for employee ${s.employeeId} after deleting vacation settlement`);
      await CentralAssignmentService.restoreAssignmentsAfterVacationDeletion(s.employeeId, s.vacationStartDate);
      console.log(`[Final Settlement] Assignment restore complete for employee ${s.employeeId}`);
    } else if (s.settlementType === 'exit' && s.lastWorkingDate) {
      // For exit settlements, restore assignments that were completed on the last working date using central service
      console.log(`[Final Settlement] Restoring assignments for employee ${s.employeeId} after deleting exit settlement`);
      await CentralAssignmentService.restoreAssignmentsAfterExitDeletion(s.employeeId, s.lastWorkingDate);
      console.log(`[Final Settlement] Assignment restore complete for employee ${s.employeeId}`);
    }

    // Delete the settlement
    await db
      .delete(finalSettlements)
      .where(eq(finalSettlements.id, settlementId));

    return NextResponse.json({
      success: true,
      message: 'Final settlement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting final settlement:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete final settlement',
      },
      { status: 500 }
    );
  }
}
