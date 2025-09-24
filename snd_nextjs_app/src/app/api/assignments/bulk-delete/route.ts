import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeAssignments } from '@/lib/drizzle/schema';
import { withEmployeeListPermission } from '@/lib/rbac/api-middleware';
import { and, eq, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/assignments/bulk-delete - Delete multiple assignments
const bulkDeleteAssignmentsHandler = async (
  request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }
) => {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of assignment IDs to delete' },
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

    // For employee users, ensure they can only delete their own assignments
    if (request.employeeAccess?.ownEmployeeId) {
      const assignments = await db
        .select({ id: employeeAssignments.id, employeeId: employeeAssignments.employeeId })
        .from(employeeAssignments)
        .where(and(
          inArray(employeeAssignments.id, validIds),
          eq(employeeAssignments.employeeId, request.employeeAccess.ownEmployeeId)
        ));

      if (assignments.length !== validIds.length) {
        return NextResponse.json(
          { error: 'You can only delete your own assignments' },
          { status: 403 }
        );
      }
    }

    // Delete the assignments
    const deletedAssignments = await db
      .delete(employeeAssignments)
      .where(inArray(employeeAssignments.id, validIds))
      .returning();

    return NextResponse.json({
      message: `Successfully deleted ${deletedAssignments.length} assignments`,
      deleted: deletedAssignments.length,
      data: deletedAssignments,
    });
  } catch (error) {
    console.error('Error in bulkDeleteAssignmentsHandler:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

export const POST = withEmployeeListPermission(bulkDeleteAssignmentsHandler);
