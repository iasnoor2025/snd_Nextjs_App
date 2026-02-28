import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pettyCashAccounts, pettyCashTransactions } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getHandler = async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const accounts =
      activeOnly
        ? await db
            .select()
            .from(pettyCashAccounts)
            .where(eq(pettyCashAccounts.isActive, true))
            .orderBy(desc(pettyCashAccounts.id))
        : await db.select().from(pettyCashAccounts).orderBy(desc(pettyCashAccounts.id));

    const txList = await db.select({ accountId: pettyCashTransactions.accountId, type: pettyCashTransactions.type, amount: pettyCashTransactions.amount }).from(pettyCashTransactions);
    const balanceByAccount: Record<number, { in: number; out: number }> = {};
    for (const tx of txList) {
      const id = tx.accountId;
      if (!balanceByAccount[id]) balanceByAccount[id] = { in: 0, out: 0 };
      const amt = Number(tx.amount ?? 0);
      if (tx.type === 'IN') balanceByAccount[id].in += amt;
      else balanceByAccount[id].out += amt;
    }

    const data = accounts.map((a) => {
      const opening = Number(a.openingBalance ?? 0);
      const bal = balanceByAccount[a.id];
      const currentBalance = opening + (bal ? bal.in - bal.out : 0);
      return { ...a, openingBalance: opening, currentBalance };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching petty cash accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch petty cash accounts', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
};

const postHandler = async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, companyId, locationId, currency, openingBalance } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const [created] = await db
      .insert(pettyCashAccounts)
      .values({
        name: String(name).trim(),
        description: description?.trim() || null,
        companyId: companyId != null ? parseInt(companyId) : null,
        locationId: locationId != null ? parseInt(locationId) : null,
        currency: currency || 'SAR',
        openingBalance: String(Math.max(0, parseFloat(openingBalance) || 0)),
        isActive: true,
        createdBy: session.user.employeeId != null ? parseInt(String(session.user.employeeId)) : null,
        createdAt: today,
        updatedAt: today,
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating petty cash account:', error);
    return NextResponse.json(
      { error: 'Failed to create petty cash account', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.pettyCash.read)(getHandler);
export const POST = withPermission(PermissionConfigs.pettyCash.create)(postHandler);
