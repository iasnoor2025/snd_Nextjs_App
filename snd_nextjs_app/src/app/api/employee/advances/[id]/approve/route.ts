import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("POST /api/employee/advances/[id]/approve called");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const advanceId = parseInt(params.id);
    if (!advanceId) {
      return NextResponse.json({ error: "Invalid advance ID" }, { status: 400 });
    }

    // Check if advance exists and is pending
    const advance = await prisma.employeeAdvance.findUnique({
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

    // Update advance status to approved
    const updatedAdvance = await prisma.employeeAdvance.update({
      where: { id: advanceId },
      data: {
        status: "approved",
        approved_by: session.user.id,
        approved_at: new Date(),
      },
    });

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