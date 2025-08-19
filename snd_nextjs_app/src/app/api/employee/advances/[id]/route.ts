import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { advancePayments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Explicit route configuration for Next.js 15
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Additional route configuration for Next.js 15
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const advanceId = parseInt(resolvedParams.id);
    if (!advanceId) {
      return NextResponse.json({ error: 'Invalid advance ID' }, { status: 400 });
    }

    const body = await request.json();
    const { monthly_deduction } = body;

    // Check if advance exists using Drizzle
    const advanceRows = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, advanceId))
      .limit(1);

    if (advanceRows.length === 0) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    // Update the advance using Drizzle
    const updatedAdvanceRows = await db
      .update(advancePayments)
      .set({
        monthlyDeduction: monthly_deduction ? parseFloat(monthly_deduction).toString() : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(advancePayments.id, advanceId))
      .returning();

    const updatedAdvance = updatedAdvanceRows[0];

    return NextResponse.json({
      success: true,
      advance: updatedAdvance,
      message: 'Advance updated successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        error: `Failed to update advance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const advanceId = parseInt(resolvedParams.id);
    if (!advanceId) {
      return NextResponse.json({ error: 'Invalid advance ID' }, { status: 400 });
    }

    // Check if advance exists using Drizzle
    const advanceRows = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, advanceId))
      .limit(1);

    if (advanceRows.length === 0) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    // Soft delete the advance using Drizzle
    const deletedAdvanceRows = await db
      .update(advancePayments)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(advancePayments.id, advanceId))
      .returning();

    const deletedAdvance = deletedAdvanceRows[0];

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
