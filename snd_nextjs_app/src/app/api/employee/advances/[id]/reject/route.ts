import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
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

    // Check if advance exists and is pending
    const advance = await prisma.advancePayment.findUnique({
      where: { id: advanceId },
    });

    if (!advance) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    if (advance.status !== "pending") {
      return NextResponse.json(
        { error: "Advance is not in pending status" },
        { status: 400 }
      );
    }

    // Update advance status to rejected
    const updatedAdvance = await prisma.advancePayment.update({
      where: { id: advanceId },
      data: {
        status: "rejected",
        rejected_by: parseInt(session.user.id),
        rejected_at: new Date(),
        rejection_reason: rejectionReason,
      },
    });

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