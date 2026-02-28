import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import puppeteer from 'puppeteer';
import { db } from '@/lib/db';
import { pettyCashTransactions, pettyCashAccounts, expenseCategories } from '@/lib/drizzle/schema';
import { eq, and, desc, gte, lte, or, ilike } from 'drizzle-orm';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const getHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const type = searchParams.get('type');
    const search = searchParams.get('search')?.trim();
    const sortColumn = searchParams.get('sortColumn') || 'date';
    const sortDirection = searchParams.get('sortDirection') || 'asc';

    const conditions = [];
    if (accountId && !isNaN(parseInt(accountId))) {
      conditions.push(eq(pettyCashTransactions.accountId, parseInt(accountId)));
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
        categoryName: expenseCategories.name,
      })
      .from(pettyCashTransactions)
      .leftJoin(pettyCashAccounts, eq(pettyCashTransactions.accountId, pettyCashAccounts.id))
      .leftJoin(expenseCategories, eq(pettyCashTransactions.expenseCategoryId, expenseCategories.id))
      .where(whereClause)
      .orderBy(desc(pettyCashTransactions.transactionDate), desc(pettyCashTransactions.id));

    const transactions = list.map((row) => ({
      ...row,
      amount: Number(row.amount ?? 0),
    }));

    // Fetch accounts for running balance
    const accounts = await db.select().from(pettyCashAccounts).where(eq(pettyCashAccounts.isActive, true));
    const txList = await db
      .select({ accountId: pettyCashTransactions.accountId, type: pettyCashTransactions.type, amount: pettyCashTransactions.amount })
      .from(pettyCashTransactions);
    const balanceByAccount: Record<number, { in: number; out: number }> = {};
    for (const tx of txList) {
      const id = tx.accountId;
      if (!balanceByAccount[id]) balanceByAccount[id] = { in: 0, out: 0 };
      const amt = Number(tx.amount ?? 0);
      if (tx.type === 'IN') balanceByAccount[id].in += amt;
      else balanceByAccount[id].out += amt;
    }

    const accountBalances = new Map<number, number>();
    accounts.forEach((a) => {
      const opening = Number(a.openingBalance ?? 0);
      const bal = balanceByAccount[a.id];
      accountBalances.set(a.id, opening + (bal ? bal.in - bal.out : 0));
    });

    let transactionsWithBalance = transactions.map((tx) => {
      const balance = accountBalances.get(tx.accountId) ?? 0;
      const isIn = tx.type === 'IN';
      const delta = isIn ? tx.amount : -(tx.amount ?? 0);
      accountBalances.set(tx.accountId, balance - delta);
      return { ...tx, runningBalance: balance };
    });

    transactionsWithBalance = sortTransactions(transactionsWithBalance, sortColumn, sortDirection);

    let accountName: string | null = null;
    if (accountId && accountId !== 'all') {
      const acc = await db
        .select({ name: pettyCashAccounts.name })
        .from(pettyCashAccounts)
        .where(eq(pettyCashAccounts.id, parseInt(accountId)))
        .limit(1);
      accountName = acc[0]?.name ?? null;
    }

    const html = generateReportHTML(
      transactionsWithBalance,
      { accountId, type, dateFrom, dateTo, search, accountName }
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });

      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = `Petty_Cash_Report_${dateStr}.pdf`;

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error generating petty cash PDF report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
};

function sortTransactions<T extends { transactionDate?: string; accountId?: number; accountName?: string; type?: string; amount?: number; description?: string; categoryName?: string; id?: number; runningBalance?: number }>(
  list: T[],
  column: string,
  direction: string
): T[] {
  const mult = direction === 'asc' ? 1 : -1;
  const typeOrder: Record<string, number> = { IN: 0, OUT: 1, EXPENSE: 2, ADJUSTMENT: 3 };
  return [...list].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    switch (column) {
      case 'date': {
        aVal = a.transactionDate || '';
        bVal = b.transactionDate || '';
        const dateCmp = mult * (String(aVal).localeCompare(String(bVal)) || 0);
        if (dateCmp !== 0) return dateCmp;
        const aType = typeOrder[a.type ?? ''] ?? 4;
        const bType = typeOrder[b.type ?? ''] ?? 4;
        return aType - bType;
      }
      case 'account':
        aVal = (a.accountName ?? a.accountId)?.toString() ?? '';
        bVal = (b.accountName ?? b.accountId)?.toString() ?? '';
        return mult * (aVal.localeCompare(bVal) || 0);
      case 'type':
        aVal = a.type ?? '';
        bVal = b.type ?? '';
        return mult * (aVal.localeCompare(bVal) || 0);
      case 'amount':
        aVal = a.amount ?? 0;
        bVal = b.amount ?? 0;
        return mult * (aVal - bVal);
      case 'description':
        aVal = (a.description ?? '').toLowerCase();
        bVal = (b.description ?? '').toLowerCase();
        return mult * (aVal.localeCompare(bVal) || 0);
      case 'category':
        aVal = (a.categoryName ?? '').toLowerCase();
        bVal = (b.categoryName ?? '').toLowerCase();
        return mult * (aVal.localeCompare(bVal) || 0);
      case 'balance':
        aVal = a.runningBalance ?? 0;
        bVal = b.runningBalance ?? 0;
        return mult * (aVal - bVal);
      default:
        return 0;
    }
  });
}

function formatAmount(n: number): string {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    IN: 'IN',
    OUT: 'OUT',
    EXPENSE: 'EXPENSE',
    ADJUSTMENT: 'ADJUSTMENT',
  };
  return map[type] ?? type;
}

function generateReportHTML(
  transactions: Array<{
    transactionDate: string;
    accountName: string | null;
    type: string;
    amount: number;
    description: string | null;
    categoryName: string | null;
    runningBalance: number;
  }>,
  filters: {
    accountId: string;
    type: string | null;
    dateFrom: string;
    dateTo: string;
    search: string | undefined;
    accountName: string | null;
  }
): string {
  const { accountId, type, dateFrom, dateTo, search, accountName } = filters;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Petty Cash Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 10px; margin: 0; font-size: 12px; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .text-right { text-align: right; }
    .text-green { color: #15803d; font-weight: 500; }
    .text-red { color: #b91c1c; font-weight: 500; }
    .summary { background-color: #f9f9f9; padding: 8px; margin: 10px 0; border-radius: 4px; font-size: 12px; }
    @media print { body { padding: 6px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>Petty Cash Report</h1>
  <div class="summary">
    <strong>Report Date:</strong> ${format(new Date(), 'MMMM dd, yyyy')}<br/>
    ${accountName ? `<strong>Account:</strong> ${accountName}<br/>` : ''}
    ${dateFrom ? `<strong>Date From:</strong> ${dateFrom}<br/>` : ''}
    ${dateTo ? `<strong>Date To:</strong> ${dateTo}<br/>` : ''}
    ${type && type !== 'all' ? `<strong>Type:</strong> ${getTypeLabel(type)}<br/>` : ''}
    ${search ? `<strong>Search:</strong> ${search}<br/>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Account</th>
        <th>Type</th>
        <th>Description</th>
        <th>Category</th>
        <th class="text-right">In (SAR)</th>
        <th class="text-right">Out (SAR)</th>
        <th class="text-right">Balance (SAR)</th>
      </tr>
    </thead>
    <tbody>
`;

  if (transactions.length === 0) {
    html += `<tr><td colspan="8" style="text-align:center;color:#666;">No transactions found.</td></tr>`;
  } else {
    let totalIn = 0;
    let totalOut = 0;
    transactions.forEach((tx) => {
      const isIn = tx.type === 'IN';
      if (isIn) totalIn += tx.amount;
      else totalOut += tx.amount;
      const amt = formatAmount(tx.amount);
      const inCell = isIn ? `<span class="text-green">${amt}</span>` : '—';
      const outCell = !isIn ? `<span class="text-red">${amt}</span>` : '—';
      const balClass = tx.runningBalance >= 0 ? 'text-green' : 'text-red';
      const bal = formatAmount(tx.runningBalance);
      const dateStr = tx.transactionDate ? format(new Date(tx.transactionDate + 'T12:00:00'), 'yyyy-MM-dd') : '—';
      html += `
      <tr${isIn ? ' style="background-color:#f0fdf4;"' : ''}>
        <td>${dateStr}</td>
        <td>${tx.accountName ?? tx.accountId}</td>
        <td>${getTypeLabel(tx.type)}</td>
        <td>${(tx.description || '—').replace(/</g, '&lt;')}</td>
        <td>${tx.categoryName || '—'}</td>
        <td class="text-right">${inCell}</td>
        <td class="text-right">${outCell}</td>
        <td class="text-right ${balClass}">${bal}</td>
      </tr>`;
    });
    const mostRecent = transactions.reduce((a, b) => {
      const aDate = a.transactionDate || '';
      const bDate = b.transactionDate || '';
      if (aDate > bDate) return a;
      if (aDate < bDate) return b;
      return (a.id ?? 0) > (b.id ?? 0) ? a : b;
    });
    const lastBalance = mostRecent?.runningBalance ?? 0;
    const lastBalClass = lastBalance >= 0 ? 'text-green' : 'text-red';
    html += `
      <tr style="background-color:#f0f0f0;font-weight:bold;">
        <td colspan="3">Total In / Total Out / Closing Balance</td>
        <td colspan="2"></td>
        <td class="text-right text-green">${formatAmount(totalIn)}</td>
        <td class="text-right text-red">${formatAmount(totalOut)}</td>
        <td class="text-right ${lastBalClass}">${formatAmount(lastBalance)}</td>
      </tr>`;
  }

  html += `
    </tbody>
  </table>
</body>
</html>`;

  return html;
}

export const GET = withPermission(PermissionConfigs.pettyCash.read)(getHandler);
