import { db } from '@/lib/db';
import { advancePayments } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { and, eq, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function deleteAdvanceHandler(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const advanceId = parseInt(id, 10);
    if (!advanceId) {
      return NextResponse.json({ error: 'Invalid advance ID' }, { status: 400 });
    }

    const existing = await db
      .select({ id: advancePayments.id })
      .from(advancePayments)
      .where(and(eq(advancePayments.id, advanceId), isNull(advancePayments.deletedAt)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    await db
      .update(advancePayments)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(advancePayments.id, advanceId));

    return NextResponse.json({
      success: true,
      message: 'Advance deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to delete advance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

export const DELETE = withPermission(PermissionConfigs.advance.delete)(deleteAdvanceHandler);
