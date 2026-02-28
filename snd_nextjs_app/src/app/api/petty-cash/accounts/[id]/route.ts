import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pettyCashAccounts, pettyCashTransactions } from '@/lib/drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getHandler = async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const accountId = parseInt(id);
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const [account] = await db.select().from(pettyCashAccounts).where(eq(pettyCashAccounts.id, accountId)).limit(1);
    if (!account) {
      return NextResponse.json({ error: 'Petty cash account not found' }, { status: 404 });
    }

    // Current balance: opening + IN - OUT
    const sums = await db
      .select({
        totalIn: sql<string>`COALESCE(SUM(CASE WHEN ${pettyCashTransactions.type} = 'IN' THEN ${pettyCashTransactions.amount}::numeric ELSE 0 END), 0)`,
        totalOut: sql<string>`COALESCE(SUM(CASE WHEN ${pettyCashTransactions.type} IN ('OUT', 'EXPENSE') THEN ${pettyCashTransactions.amount}::numeric ELSE 0 END), 0)`,
      })
      .from(pettyCashTransactions)
      .where(eq(pettyCashTransactions.accountId, accountId));

    const totalIn = Number(sums[0]?.totalIn ?? 0);
    const totalOut = Number(sums[0]?.totalOut ?? 0);
    const opening = Number(account.openingBalance ?? 0);
    const currentBalance = opening + totalIn - totalOut;

    return NextResponse.json({
      success: true,
      data: {
        ...account,
        openingBalance: opening,
        currentBalance,
      },
    });
  } catch (error) {
    console.error('Error fetching petty cash account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch petty cash account', details: error instanceof Error ? error.message : 'Unknown' },
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
    const accountId = parseInt(id);
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const [existing] = await db.select().from(pettyCashAccounts).where(eq(pettyCashAccounts.id, accountId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Petty cash account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, companyId, locationId, currency, openingBalance, isActive } = body;

    const today = new Date().toISOString().split('T')[0];
    const updates: Record<string, unknown> = { updatedAt: today };
    if (name !== undefined) updates.name = String(name).trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (companyId !== undefined) updates.companyId = companyId != null ? parseInt(companyId) : null;
    if (locationId !== undefined) updates.locationId = locationId != null ? parseInt(locationId) : null;
    if (currency !== undefined) updates.currency = currency || 'SAR';
    if (openingBalance !== undefined) updates.openingBalance = String(Math.max(0, parseFloat(openingBalance) || 0));
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const [updated] = await db
      .update(pettyCashAccounts)
      .set(updates as any)
      .where(eq(pettyCashAccounts.id, accountId))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating petty cash account:', error);
    return NextResponse.json(
      { error: 'Failed to update petty cash account', details: error instanceof Error ? error.message : 'Unknown' },
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
    const accountId = parseInt(id);
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const [existing] = await db.select().from(pettyCashAccounts).where(eq(pettyCashAccounts.id, accountId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Petty cash account not found' }, { status: 404 });
    }

    // Soft-deactivate instead of hard delete to preserve history
    const today = new Date().toISOString().split('T')[0];
    await db
      .update(pettyCashAccounts)
      .set({ isActive: false, updatedAt: today })
      .where(eq(pettyCashAccounts.id, accountId));

    return NextResponse.json({ success: true, message: 'Petty cash account deactivated' });
  } catch (error) {
    console.error('Error deactivating petty cash account:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate petty cash account', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.pettyCash.read)(getHandler);
export const PUT = withPermission(PermissionConfigs.pettyCash.update)(putHandler);
export const DELETE = withPermission(PermissionConfigs.pettyCash.delete)(deleteHandler);
