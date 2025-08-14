import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { advancePayments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// Explicit route configuration for Next.js 15
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Explicit route generation for Next.js 15
export async function generateStaticParams() {
  // This helps Next.js understand the route structure
  return [];
}

// Additional route configuration for Next.js 15
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("PATCH /api/employee/advances/[id] called");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const advanceId = parseInt(resolvedParams.id);
    if (!advanceId) {
      return NextResponse.json({ error: "Invalid advance ID" }, { status: 400 });
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
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
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

    console.log("Advance updated successfully:", updatedAdvance);

    return NextResponse.json({
      success: true,
      advance: updatedAdvance,
      message: "Advance updated successfully",
    });
  } catch (error) {
    console.error("Error updating advance:", error);
    return NextResponse.json(
      { error: `Failed to update advance: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("DELETE /api/employee/advances/[id] called");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const advanceId = parseInt(resolvedParams.id);
    if (!advanceId) {
      return NextResponse.json({ error: "Invalid advance ID" }, { status: 400 });
    }

    // Check if advance exists using Drizzle
    const advanceRows = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, advanceId))
      .limit(1);

    if (advanceRows.length === 0) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
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

    console.log("Advance deleted successfully:", deletedAdvance);

    return NextResponse.json({
      success: true,
      message: "Advance deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting advance:", error);
    return NextResponse.json(
      { error: `Failed to delete advance: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 