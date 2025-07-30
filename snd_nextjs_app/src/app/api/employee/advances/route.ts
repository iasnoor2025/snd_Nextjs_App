import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/employee/advances called");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, amount, monthly_deduction, reason } = body;

    console.log("Received advance request:", { employeeId, amount, monthly_deduction, reason });

    if (!employeeId || !amount || !reason) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: employeeId, amount, and reason are required" },
        { status: 400 }
      );
    }

    // Test database connection first
    console.log("Testing database connection...");
    await prisma.$connect();
    console.log("Database connected successfully");

    // Validate that employee exists
    console.log("Checking if employee exists...");
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
    });

    if (!employee) {
      console.log("Employee not found");
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    console.log("Employee found:", employee.id);

    // Create the advance record
    console.log("Creating advance record...");
    const advance = await prisma.employeeAdvance.create({
      data: {
        employee_id: parseInt(employeeId),
        amount: parseFloat(amount),
        monthly_deduction: monthly_deduction ? parseFloat(monthly_deduction) : null,
        reason: reason,
        status: "pending",
      },
    });

    console.log("Advance created successfully:", advance);

    return NextResponse.json({
      success: true,
      advance: advance,
      message: "Advance request created successfully",
    });
  } catch (error) {
    console.error("Error creating advance:", error);
    return NextResponse.json(
      { error: `Failed to create advance request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Get advances for the employee
    const advances = await prisma.employeeAdvance.findMany({
      where: {
        employee_id: parseInt(employeeId),
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      advances: advances,
    });
  } catch (error) {
    console.error("Error fetching advances:", error);
    return NextResponse.json(
      { error: "Failed to fetch advances" },
      { status: 500 }
    );
  }
} 