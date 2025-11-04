import { db } from '@/lib/drizzle';
import { payrollItems, payrolls } from '@/lib/drizzle/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';


export async function POST(_request: NextRequest) {
  try {
    // Check user session and permissions
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Check if user is super admin
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

    // Check if any of the payrolls are already paid
    const paidPayrolls = await db
      .select({ id: payrolls.id, status: payrolls.status })
      .from(payrolls)
      .where(and(inArray(payrolls.id, validIds), eq(payrolls.status, 'paid')));

    // Only prevent deletion of paid payrolls if user is not super admin
    if (paidPayrolls.length > 0 && !isSuperAdmin) {
      const paidIds = paidPayrolls.map(p => p.id);
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete paid payrolls. Paid payroll IDs: ${paidIds.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Delete payroll items first
    await db.delete(payrollItems).where(inArray(payrollItems.payrollId, validIds));

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
        deletedIds: deletedPayrolls.map(p => p.id),
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, message: 'Failed to delete payrolls' },
      { status: 500 }
    );
  }
}
