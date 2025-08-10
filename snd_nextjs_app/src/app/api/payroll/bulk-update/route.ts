import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { payrolls } from '@/lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please provide an array of payroll IDs to update' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Please provide update data' },
        { status: 400 }
      );
    }

    // Validate that all IDs are numbers
    const validIds = ids.filter(id => !isNaN(Number(id)));
    
    if (validIds.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: 'Some payroll IDs are invalid' },
        { status: 400 }
      );
    }

    // Check if any of the payrolls are already paid
    const paidPayrolls = await db
      .select({ id: payrolls.id, status: payrolls.status })
      .from(payrolls)
      .where(
        and(
          inArray(payrolls.id, validIds),
          eq(payrolls.status, 'paid')
        )
      );

    if (paidPayrolls.length > 0) {
      const paidIds = paidPayrolls.map(p => p.id);
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot update paid payrolls. Paid payroll IDs: ${paidIds.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only include fields that are provided
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.baseSalary !== undefined) updateData.baseSalary = updates.baseSalary.toString();
    if (updates.overtimeAmount !== undefined) updateData.overtimeAmount = updates.overtimeAmount.toString();
    if (updates.bonusAmount !== undefined) updateData.bonusAmount = updates.bonusAmount.toString();
    if (updates.deductionAmount !== undefined) updateData.deductionAmount = updates.deductionAmount.toString();
    if (updates.advanceDeduction !== undefined) updateData.advanceDeduction = updates.advanceDeduction.toString();

    // Recalculate final amount if any amount fields are updated
    if (updates.baseSalary !== undefined || updates.overtimeAmount !== undefined || 
        updates.bonusAmount !== undefined || updates.deductionAmount !== undefined || 
        updates.advanceDeduction !== undefined) {
      
      const baseSalary = Number(updates.baseSalary) || 0;
      const overtimeAmount = Number(updates.overtimeAmount) || 0;
      const bonusAmount = Number(updates.bonusAmount) || 0;
      const deductionAmount = Number(updates.deductionAmount) || 0;
      const advanceDeduction = Number(updates.advanceDeduction) || 0;
      
      updateData.finalAmount = (baseSalary + overtimeAmount + bonusAmount - deductionAmount - advanceDeduction).toString();
    }

    // Update payrolls
    const updatedPayrolls = await db
      .update(payrolls)
      .set(updateData)
      .where(inArray(payrolls.id, validIds))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedPayrolls.length} payroll(s)`,
      data: {
        updatedCount: updatedPayrolls.length,
        updatedIds: updatedPayrolls.map(p => p.id)
      }
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update payrolls' },
      { status: 500 }
    );
  }
}
