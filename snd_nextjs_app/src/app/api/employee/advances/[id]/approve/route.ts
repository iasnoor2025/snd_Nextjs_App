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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("POST /api/employee/advances/[id]/approve called");
    
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
    
    if (!advance) {
      return NextResponse.json(
        { error: "Advance not found" },
        { status: 404 }
      );
    }

    if (advance.status !== "pending") {
      return NextResponse.json(
        { error: "Advance is not in pending status" },
        { status: 400 }
      );
    }

    // Update advance status to approved using Drizzle
    const updatedAdvanceRows = await db
      .update(advancePayments)
      .set({
        status: "approved",
        approvedBy: parseInt(session.user.id),
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(advancePayments.id, advanceId))
      .returning();

    const updatedAdvance = updatedAdvanceRows[0];

    console.log("Advance approved successfully:", updatedAdvance);

    return NextResponse.json({
      success: true,
      advance: updatedAdvance,
      message: "Advance approved successfully",
    });
  } catch (error) {
    console.error("Error approving advance:", error);
    return NextResponse.json(
      { error: `Failed to approve advance: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 