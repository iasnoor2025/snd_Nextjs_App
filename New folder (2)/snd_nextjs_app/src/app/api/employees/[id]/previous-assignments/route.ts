import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeAssignments, rentals, rentalItems, equipment, employees, designations, customers } from '@/lib/drizzle/schema';
import { eq, and, or, isNull, gte, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    // First, check if employee is supervisor/foreman
    const employee = await db
      .select({
        id: employees.id,
        designationId: employees.designationId,
        designationName: designations.name,
        supervisor: employees.supervisor,
      })
      .from(employees)
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employees.id, employeeId))
      .limit(1);

    const isSupervisorOrForeman = employee.length > 0 && (
      employee[0].supervisor ||
      (employee[0].designationName && (
        employee[0].designationName.toLowerCase().includes('supervisor') ||
        employee[0].designationName.toLowerCase().includes('foreman') ||
        employee[0].designationName.toLowerCase().includes('foreman')
      ))
    );

    // Get all active assignments for this employee
    // An assignment is active if:
    // 1. status = 'active' AND
    // 2. (endDate IS NULL OR endDate >= today)
    const today = new Date().toISOString().split('T')[0];

    // Get assignments where employee is operator
    const operatorAssignmentsRaw = await db
      .select({
        id: employeeAssignments.id,
        rentalId: employeeAssignments.rentalId,
        projectId: employeeAssignments.projectId,
        startDate: employeeAssignments.startDate,
        endDate: employeeAssignments.endDate,
        status: employeeAssignments.status,
        notes: employeeAssignments.notes,
        type: employeeAssignments.type,
        rentalNumber: rentals.rentalNumber,
        rentalStatus: rentals.status,
        customerName: customers.name,
        customerCompanyName: customers.companyName,
        equipmentName: equipment.name,
        equipmentId: rentalItems.equipmentId,
      })
      .from(employeeAssignments)
      .leftJoin(rentals, eq(employeeAssignments.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(
        rentalItems,
        and(
          eq(rentalItems.rentalId, employeeAssignments.rentalId),
          eq(rentalItems.operatorId, employeeAssignments.employeeId)
        )
      )
      .leftJoin(equipment, eq(rentalItems.equipmentId, equipment.id))
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          eq(employeeAssignments.status, 'active'),
          or(
            isNull(employeeAssignments.endDate),
            gte(employeeAssignments.endDate, today)
          )
        )
      );

    // Get assignments where employee is supervisor
    const supervisorAssignmentsRaw = await db
      .select({
        id: rentalItems.id,
        rentalId: rentalItems.rentalId,
        startDate: rentalItems.startDate,
        status: rentalItems.status,
        notes: rentalItems.notes,
        rentalNumber: rentals.rentalNumber,
        rentalStatus: rentals.status,
        equipmentName: equipment.name,
        equipmentId: rentalItems.equipmentId,
      })
      .from(rentalItems)
      .leftJoin(rentals, eq(rentalItems.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(equipment, eq(rentalItems.equipmentId, equipment.id))
      .where(
        and(
          eq(rentalItems.supervisorId, employeeId),
          eq(rentalItems.status, 'active'),
          isNull(rentalItems.completedDate)
        )
      );

    // Combine and format assignments with role
    const allAssignments = [
      ...operatorAssignmentsRaw.map(a => ({ ...a, role: 'operator' as const, projectId: a.projectId || null, endDate: a.endDate || null, type: a.type || 'rental' })),
      ...supervisorAssignmentsRaw.map(a => ({ ...a, role: 'supervisor' as const, projectId: null, endDate: null, type: 'rental' })),
    ];

    return NextResponse.json({
      assignments: allAssignments,
      count: allAssignments.length,
      isSupervisorOrForeman: !!isSupervisorOrForeman,
    });
  } catch (error) {
    console.error('Error fetching previous assignments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch previous assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

