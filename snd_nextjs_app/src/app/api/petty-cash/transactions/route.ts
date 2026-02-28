import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pettyCashTransactions, pettyCashAccounts, expenseCategories } from '@/lib/drizzle/schema';
import { eq, and, desc, gte, lte, or, ilike } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getHandler = async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const type = searchParams.get('type');
    const search = searchParams.get('search')?.trim();

    const conditions = [];
    if (accountId && !isNaN(parseInt(accountId))) {
      conditions.push(eq(pettyCashTransactions.accountId, parseInt(accountId)));
    }
    if (projectId && !isNaN(parseInt(projectId))) {
      conditions.push(eq(pettyCashTransactions.projectId, parseInt(projectId)));
    }
    if (status && status !== 'all') {
      conditions.push(eq(pettyCashTransactions.status, status));
    }
    if (type && type !== 'all') {
      conditions.push(eq(pettyCashTransactions.type, type));
    }
    if (dateFrom) {
      conditions.push(gte(pettyCashTransactions.transactionDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(pettyCashTransactions.transactionDate, dateTo));
    }
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(pettyCashTransactions.description, searchPattern),
          ilike(pettyCashTransactions.reference, searchPattern),
          ilike(pettyCashTransactions.receiptNumber, searchPattern),
          ilike(pettyCashAccounts.name, searchPattern),
          ilike(expenseCategories.name, searchPattern)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db
      .select({
        id: pettyCashTransactions.id,
        accountId: pettyCashTransactions.accountId,
        accountName: pettyCashAccounts.name,
        transactionDate: pettyCashTransactions.transactionDate,
        type: pettyCashTransactions.type,
        amount: pettyCashTransactions.amount,
        description: pettyCashTransactions.description,
        reference: pettyCashTransactions.reference,
        receiptNumber: pettyCashTransactions.receiptNumber,
        expenseCategoryId: pettyCashTransactions.expenseCategoryId,
        categoryName: expenseCategories.name,
        projectId: pettyCashTransactions.projectId,
        employeeId: pettyCashTransactions.employeeId,
        status: pettyCashTransactions.status,
        createdAt: pettyCashTransactions.createdAt,
      })
      .from(pettyCashTransactions)
      .leftJoin(pettyCashAccounts, eq(pettyCashTransactions.accountId, pettyCashAccounts.id))
      .leftJoin(expenseCategories, eq(pettyCashTransactions.expenseCategoryId, expenseCategories.id))
      .where(whereClause)
      .orderBy(desc(pettyCashTransactions.transactionDate), desc(pettyCashTransactions.id));

    const data = list.map((row) => ({
      ...row,
      amount: Number(row.amount ?? 0),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching petty cash transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch petty cash transactions', details: error instanceof Error ? error.message : 'Unknown' },
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
    const {
      accountId,
      transactionDate,
      type,
      amount,
      description,
      reference,
      receiptNumber,
      expenseCategoryId,
      projectId,
      employeeId,
    } = body;

    if (!accountId || isNaN(parseInt(accountId))) {
      return NextResponse.json({ error: 'Account is required' }, { status: 400 });
    }
    if (!transactionDate) {
      return NextResponse.json({ error: 'Transaction date is required' }, { status: 400 });
    }
    if (!type || !['IN', 'OUT', 'EXPENSE', 'ADJUSTMENT'].includes(String(type).toUpperCase())) {
      return NextResponse.json({ error: 'Type must be IN, OUT, EXPENSE, or ADJUSTMENT' }, { status: 400 });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const dateStr = String(transactionDate).split('T')[0];

    const [created] = await db
      .insert(pettyCashTransactions)
      .values({
        accountId: parseInt(accountId),
        transactionDate: dateStr,
        type: String(type).toUpperCase(),
        amount: String(amountNum),
        description: description?.trim() || null,
        reference: reference?.trim() || null,
        receiptNumber: receiptNumber?.trim() || null,
        expenseCategoryId: expenseCategoryId != null ? parseInt(expenseCategoryId) : null,
        projectId: projectId != null && projectId !== '' ? parseInt(projectId) : null,
        employeeId: employeeId != null && employeeId !== '' ? parseInt(employeeId) : null,
        createdBy: session.user.employeeId != null ? parseInt(String(session.user.employeeId)) : null,
        status: 'pending',
        createdAt: today,
        updatedAt: today,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: { ...created, amount: Number(created.amount) } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating petty cash transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create petty cash transaction', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.pettyCash.read)(getHandler);
export const POST = withPermission(PermissionConfigs.pettyCash.create)(postHandler);
