
import { db } from '@/lib/drizzle';
import { employeeAssignments } from '@/lib/drizzle/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, employeeId } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of assignment IDs to delete' },
        { status: 400 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Validate that all IDs are numbers
    const validIds = ids.filter((id: any) => !isNaN(Number(id))).map((id: any) => Number(id));

    if (validIds.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some assignment IDs are invalid' },
        { status: 400 }
      );
    }

    // Check if assignments exist and belong to the specified employee
    const existingAssignments = await db
      .select()
      .from(employeeAssignments)
      .where(and(
        inArray(employeeAssignments.id, validIds),
        eq(employeeAssignments.employeeId, parseInt(employeeId))
      ));

    if (existingAssignments.length !== validIds.length) {
      return NextResponse.json(
        { error: 'Some assignments not found or do not belong to this employee' },
        { status: 404 }
      );
    }

    // Delete the assignments
    const deletedAssignments = await db
      .delete(employeeAssignments)
      .where(and(
        inArray(employeeAssignments.id, validIds),
        eq(employeeAssignments.employeeId, parseInt(employeeId))
      ))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedAssignments.length} employee assignments`,
      deleted: deletedAssignments.length,
      data: deletedAssignments,
    });
  } catch (error) {
    console.error('Error deleting employee assignments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete employee assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
