import { db } from '@/lib/db';
import { employees as employeesTable } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';

const getNextFileNumberHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const isExternal = searchParams.get('external') === 'true';

    if (isExternal) {
      // For external employees: generate EXT001, EXT002, etc.
      const rows = await db
        .select({
          maxExtNum: sql<number>`MAX(CASE 
            WHEN ${employeesTable.fileNumber} ~ '^EXT[0-9]+$' 
            THEN CAST(SUBSTRING(${employeesTable.fileNumber} FROM '^EXT([0-9]+)$') AS INTEGER)
            ELSE NULL 
          END)`,
        })
        .from(employeesTable)
        .where(
          and(
            isNull(employeesTable.deletedAt),
            eq(employeesTable.isExternal, true)
          )
        );

      const maxExtNum = Number((rows as { maxExtNum: number }[])[0]?.maxExtNum || 0);
      const nextNumber = maxExtNum + 1;
      const nextFileNumber = `EXT${String(nextNumber).padStart(3, '0')}`;

      return NextResponse.json({ success: true, next: nextFileNumber });
    } else {
      // For regular employees: generate 1, 2, 3, etc.
      const rows = await db
        .select({
          maxNum: sql<number>`MAX(CASE 
            WHEN ${employeesTable.fileNumber} ~ '^[0-9]+$' 
            THEN CAST(${employeesTable.fileNumber} AS INTEGER)
            ELSE NULL 
          END)`,
        })
        .from(employeesTable)
        .where(
          and(
            isNull(employeesTable.deletedAt),
            eq(employeesTable.isExternal, false)
          )
        );

      const maxNum = Number((rows as { maxNum: number }[])[0]?.maxNum || 0);
      const nextNumber = maxNum + 1;

      return NextResponse.json({ success: true, next: String(nextNumber) });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to compute next file number' },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.employee.create)(getNextFileNumberHandler);


