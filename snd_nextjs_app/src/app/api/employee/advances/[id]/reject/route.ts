import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { advancePayments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// Explicit route configuration for Next.js 15
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Additional route configuration for Next.js 15
export const runtime = 'nodejs';
export const preferredRegion = 'auto';



export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("POST /api/employee/advances/[id]/reject called");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const advanceId = parseInt(resolvedParams.id);
    if (!advanceId) {
      return NextResponse.json({ error: "Invalid advance ID" }, { status: 400 });
    }

    // Check if advance exists and is pending using Drizzle
    const advanceRows = await db
      .select()
      .from(advancePayments)
      .where(eq(advancePayments.id, advanceId))
      .limit(1);

    if (advanceRows.length === 0) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    const advance = advanceRows[0];

    if (advance.status !== "pending") {
      return NextResponse.json(
        { error: "Advance is not in pending status" },
        { status: 400 }
      );
    }

    // Update advance status to rejected using Drizzle
    const updatedAdvanceRows = await db
      .update(advancePayments)
      .set({
        status: "rejected",
        rejectedBy: parseInt(session.user.id),
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(advancePayments.id, advanceId))
      .returning();

    const updatedAdvance = updatedAdvanceRows[0];

    console.log("Advance rejected successfully:", updatedAdvance);

    return NextResponse.json({
      success: true,
      advance: updatedAdvance,
      message: "Advance rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting advance:", error);
    return NextResponse.json(
      { error: `Failed to reject advance: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 