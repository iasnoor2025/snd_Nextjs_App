import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

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

    // Check if advance exists
    const advance = await prisma.advancePayment.findUnique({
      where: { id: advanceId },
    });

    if (!advance) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    // Update the advance
    const updatedAdvance = await prisma.advancePayment.update({
      where: { id: advanceId },
      data: {
        monthly_deduction: monthly_deduction ? parseFloat(monthly_deduction) : null,
      },
    });

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

    // Check if advance exists
    const advance = await prisma.advancePayment.findUnique({
      where: { id: advanceId },
    });

    if (!advance) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    // Soft delete the advance
    const deletedAdvance = await prisma.advancePayment.update({
      where: { id: advanceId },
      data: {
        deleted_at: new Date(),
      },
    });

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