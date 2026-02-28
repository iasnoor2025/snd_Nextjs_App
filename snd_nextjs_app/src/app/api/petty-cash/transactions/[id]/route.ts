import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pettyCashTransactions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getHandler = async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const txId = parseInt(id);
    if (isNaN(txId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const [tx] = await db
      .select()
      .from(pettyCashTransactions)
      .where(eq(pettyCashTransactions.id, txId))
      .limit(1);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...tx, amount: Number(tx.amount) } });
  } catch (error) {
    console.error('Error fetching petty cash transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch petty cash transaction', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
};

const putHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const txId = parseInt(id);
    if (isNaN(txId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(pettyCashTransactions)
      .where(eq(pettyCashTransactions.id, txId))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      transactionDate,
      type,
      amount,
      description,
      reference,
      receiptNumber,
      expenseCategoryId,
      projectId,
      employeeId,
      status,
    } = body;

    const today = new Date().toISOString().split('T')[0];
    const updates: Record<string, unknown> = { updatedAt: today };
    if (transactionDate !== undefined) updates.transactionDate = String(transactionDate).split('T')[0];
    if (type !== undefined) updates.type = String(type).toUpperCase();
    if (amount !== undefined) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
      }
      updates.amount = String(amountNum);
    }
    if (description !== undefined) updates.description = description?.trim() || null;
    if (reference !== undefined) updates.reference = reference?.trim() || null;
    if (receiptNumber !== undefined) updates.receiptNumber = receiptNumber?.trim() || null;
    if (expenseCategoryId !== undefined) updates.expenseCategoryId = expenseCategoryId != null ? parseInt(expenseCategoryId) : null;
    if (projectId !== undefined) updates.projectId = projectId != null && projectId !== '' ? parseInt(projectId) : null;
    if (employeeId !== undefined) updates.employeeId = employeeId != null && employeeId !== '' ? parseInt(employeeId) : null;
    if (status !== undefined) updates.status = status || 'pending';

    const [updated] = await db
      .update(pettyCashTransactions)
      .set(updates as any)
      .where(eq(pettyCashTransactions.id, txId))
      .returning();

    return NextResponse.json({ success: true, data: { ...updated, amount: Number(updated.amount) } });
  } catch (error) {
    console.error('Error updating petty cash transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update petty cash transaction', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
};

const deleteHandler = async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const txId = parseInt(id);
    if (isNaN(txId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(pettyCashTransactions)
      .where(eq(pettyCashTransactions.id, txId))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    await db.delete(pettyCashTransactions).where(eq(pettyCashTransactions.id, txId));
    return NextResponse.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting petty cash transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete petty cash transaction', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.pettyCash.read)(getHandler);
export const PUT = withPermission(PermissionConfigs.pettyCash.update)(putHandler);
export const DELETE = withPermission(PermissionConfigs.pettyCash.delete)(deleteHandler);
