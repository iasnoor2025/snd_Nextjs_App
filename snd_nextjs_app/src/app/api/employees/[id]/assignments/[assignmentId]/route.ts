import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const assignmentId = parseInt(resolvedParams.assignmentId);
    const body = await request.json();

    if (!employeeId || !assignmentId) {
      return NextResponse.json(
        { error: "Invalid employee ID or assignment ID" },
        { status: 400 }
      );
    }

    // Check if assignment exists and belongs to employee
    const existingAssignment = await prisma.employeeAssignment.findFirst({
      where: {
        id: assignmentId,
        employee_id: employeeId,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Update assignment in database
    const assignment = await prisma.employeeAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        name: body.name,
        type: body.type,
        location: body.location,
        start_date: new Date(body.start_date),
        end_date: body.end_date ? new Date(body.end_date) : null,
        status: body.status,
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
            project_name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
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
    console.error('Error in PUT /api/employees/[id]/assignments/[assignmentId]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update assignment: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const assignmentId = parseInt(resolvedParams.assignmentId);

    if (!employeeId || !assignmentId) {
      return NextResponse.json(
        { error: "Invalid employee ID or assignment ID" },
        { status: 400 }
      );
    }

    // Check if assignment exists and belongs to employee
    const assignment = await prisma.employeeAssignment.findFirst({
      where: {
        id: assignmentId,
        employee_id: employeeId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Delete assignment from database
    await prisma.employeeAssignment.delete({
      where: {
        id: assignmentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/employees/[id]/assignments/[assignmentId]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete assignment: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
