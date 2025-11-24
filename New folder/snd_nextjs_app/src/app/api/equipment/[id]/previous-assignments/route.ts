import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { equipmentRentalHistory, rentals, rentalItems, projects, employees } from '@/lib/drizzle/schema';
import { eq, and, or, isNull, gte, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipmentId = parseInt(id);

    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    // Get all active assignments for this equipment
    // An assignment is active if:
    // 1. status = 'active' AND
    // 2. (endDate IS NULL OR endDate >= today) AND
    // 3. For rental assignments, the rental item must also be active (not completed)
    const today = new Date().toISOString().split('T')[0];

    const activeAssignments = await db
      .select({
        id: equipmentRentalHistory.id,
        rentalId: equipmentRentalHistory.rentalId,
        projectId: equipmentRentalHistory.projectId,
        employeeId: equipmentRentalHistory.employeeId,
        startDate: equipmentRentalHistory.startDate,
        endDate: equipmentRentalHistory.endDate,
        status: equipmentRentalHistory.status,
        notes: equipmentRentalHistory.notes,
        assignmentType: equipmentRentalHistory.assignmentType,
        rentalNumber: rentals.rentalNumber,
        rentalStatus: rentals.status,
        projectName: projects.name,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        rentalItemStatus: rentalItems.status,
        rentalItemCompletedDate: rentalItems.completedDate,
      })
      .from(equipmentRentalHistory)
      .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
      .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
      .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
      .leftJoin(
        rentalItems,
        and(
          eq(rentalItems.rentalId, equipmentRentalHistory.rentalId),
          eq(rentalItems.equipmentId, equipmentRentalHistory.equipmentId)
        )
      )
      .where(
        and(
          eq(equipmentRentalHistory.equipmentId, equipmentId),
          eq(equipmentRentalHistory.status, 'active'),
          or(
            isNull(equipmentRentalHistory.endDate),
            gte(equipmentRentalHistory.endDate, today)
          ),
          // For rental assignments, also check that rental item is not completed
          or(
            // Not a rental assignment
            sql`${equipmentRentalHistory.assignmentType} != 'rental'`,
            // Is a rental assignment but rental item doesn't exist (legacy data)
            sql`${rentalItems.id} IS NULL`,
            // Is a rental assignment and rental item exists but is active (not completed)
            and(
              sql`${rentalItems.id} IS NOT NULL`,
              sql`${rentalItems.status} = 'active'`,
              sql`${rentalItems.completedDate} IS NULL`
            )
          )
        )
      );

    // Filter out assignments where rental item is completed
    const validAssignments = activeAssignments.filter(assignment => {
      // If it's a rental assignment with a rental item, check if the item is still active
      if (assignment.rentalId && assignment.rentalItemStatus) {
        return assignment.rentalItemStatus === 'active' && !assignment.rentalItemCompletedDate;
      }
      // For non-rental assignments or rental assignments without items, return them
      return true;
    });

    return NextResponse.json({
      assignments: validAssignments,
      count: validAssignments.length,
    });
  } catch (error) {
    console.error('Error fetching previous equipment assignments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch previous equipment assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





