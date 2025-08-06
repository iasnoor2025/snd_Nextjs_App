import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/db';
import { withEmployeeOwnDataAccess } from '@/lib/rbac/api-middleware';

const createEmployeeAdvanceHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    console.log("POST /api/employee/advances called");
    
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

    // For employee users, ensure they can only create advances for themselves
    if (request.employeeAccess?.ownEmployeeId) {
      if (parseInt(employeeId) !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: "You can only create advances for yourself" },
          { status: 403 }
        );
      }
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
    const advance = await prisma.advancePayment.create({
      data: {
        employee_id: parseInt(employeeId),
        amount: parseFloat(amount),
        purpose: "advance",
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
};

const getEmployeeAdvancesHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // For employee users, ensure they can only access their own advance data
    if (request.employeeAccess?.ownEmployeeId) {
      if (parseInt(employeeId) !== request.employeeAccess.ownEmployeeId) {
        return NextResponse.json(
          { error: "You can only access your own advance data" },
          { status: 403 }
        );
      }
    }

    // Get advances for the employee
    const advances = await prisma.advancePayment.findMany({
      where: {
        employee_id: parseInt(employeeId),
        deleted_at: null,
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
      data: advances,
    });
  } catch (error) {
    console.error("Error fetching employee advances:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee advances" },
      { status: 500 }
    );
  }
};

// Export the wrapped handlers
export const POST = withEmployeeOwnDataAccess(createEmployeeAdvanceHandler);
export const GET = withEmployeeOwnDataAccess(getEmployeeAdvancesHandler); 