import { db } from '@/lib/db';
import { employees as employeesTable } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { NextResponse } from 'next/server';
import { isNull, sql } from 'drizzle-orm';

const getNextFileNumberHandler = async () => {
  try {
    // Find the maximum numeric file_number among non-deleted employees
    const rows = await db
      .select({
        maxNum: sql<number>`MAX(CASE WHEN ${employeesTable.fileNumber} ~ '^[0-9]+' THEN (${employeesTable.fileNumber})::int ELSE NULL END)`,
        maxRaw: sql<string | null>`MAX(${employeesTable.fileNumber})`,
      })
      .from(employeesTable)
      .where(isNull(employeesTable.deletedAt));

    const maxNum = Number((rows as { maxNum: number; maxRaw: string | null }[])[0]?.maxNum || 0);
    const nextNumber = maxNum + 1;

    return NextResponse.json({ success: true, next: String(nextNumber) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to compute next file number' },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.employee.create)(getNextFileNumberHandler);


