import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Fetch assignments from database
    const assignments = await prisma.employeeAssignment.findMany({
      where: {
        employee_id: employeeId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        rental: {
          select: {
            id: true,
            rental_number: true,
          },
        },
      },
      orderBy: {
        start_date: 'desc',
      },
    });

    // Format assignments to match Laravel response
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      name: assignment.name,
      type: assignment.type,
      location: assignment.location,
      start_date: assignment.start_date.toISOString().slice(0, 10),
      end_date: assignment.end_date?.toISOString().slice(0, 10) || null,
      status: assignment.status,
      notes: assignment.notes,
      project_id: assignment.project_id,
      rental_id: assignment.rental_id,
      project: assignment.project,
      rental: assignment.rental ? {
        id: assignment.rental.id,
        rental_number: assignment.rental.rental_number,
        project_name: null, // We'll add this later if needed
      } : null,
      created_at: assignment.created_at.toISOString(),
      updated_at: assignment.updated_at.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedAssignments,
      message: 'Assignments retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch assignments: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name || !body.start_date) {
      return NextResponse.json(
        { error: "Assignment name and start date are required" },
        { status: 400 }
      );
    }

    // Create assignment in database
    const assignment = await prisma.employeeAssignment.create({
      data: {
        employee_id: employeeId,
        name: body.name,
        type: body.type || 'manual',
        location: body.location,
        start_date: new Date(body.start_date),
        end_date: body.end_date ? new Date(body.end_date) : null,
        status: body.status || 'active',
        notes: body.notes,
        project_id: body.project_id || null,
        rental_id: body.rental_id || null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        rental: {
          select: {
            id: true,
            rental_number: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      data: {
        id: assignment.id,
        name: assignment.name, 
        type: assignment.type, 
        location: assignment.location, 
        start_date: assignment.start_date.toISOString().slice(0, 10),
        end_date: assignment.end_date?.toISOString().slice(0, 10) || null,
        status: assignment.status,
        notes: assignment.notes,
        project_id: assignment.project_id,
        rental_id: assignment.rental_id,
        project: assignment.project,
        rental: assignment.rental,
        created_at: assignment.created_at.toISOString(),
        updated_at: assignment.updated_at.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/assignments:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create assignment: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}


