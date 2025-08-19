import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectExpenses } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, expenseId } = await params;

    // Validate IDs
    if (!projectId || !expenseId || isNaN(parseInt(projectId)) || isNaN(parseInt(expenseId))) {
      return NextResponse.json({ error: 'Invalid project ID or expense ID' }, { status: 400 });
    }

    // Delete expense
    await db
      .delete(projectExpenses)
      .where(
        and(
          eq(projectExpenses.id, parseInt(expenseId)),
          eq(projectExpenses.projectId, parseInt(projectId))
        )
      );

    return NextResponse.json({ 
      success: true,
      message: 'Expense deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
