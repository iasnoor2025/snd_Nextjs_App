import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { payrolls, payrollItems } from '@/lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { and } from 'drizzle-orm';

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please provide an array of payroll IDs to delete' },
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
          message: `Cannot delete paid payrolls. Paid payroll IDs: ${paidIds.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Delete payroll items first
    await db
      .delete(payrollItems)
      .where(inArray(payrollItems.payrollId, validIds));

    // Delete payrolls
    const deletedPayrolls = await db
      .delete(payrolls)
      .where(inArray(payrolls.id, validIds))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedPayrolls.length} payroll(s)`,
      data: {
        deletedCount: deletedPayrolls.length,
        deletedIds: deletedPayrolls.map(p => p.id)
      }
    });

  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete payrolls' },
      { status: 500 }
    );
  }
}
