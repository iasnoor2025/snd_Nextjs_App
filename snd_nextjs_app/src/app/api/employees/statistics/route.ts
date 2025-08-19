import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { employeeAssignments, employees } from '@/lib/drizzle/schema';
import { withAuth } from '@/lib/rbac/api-middleware';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const getEmployeeStatisticsHandler = async () => {
  try {

    // Drizzle pool is initialized on import

    // Get session to check user role
    const session = await getServerSession(authConfig);
    const user = session?.user;

    // For employee users, only show statistics for their own record
    let ownEmployeeFileNumber: string | null = null;
    if (user?.role === 'EMPLOYEE' && user.national_id) {
      try {
        const ownRows = await db
          .select({ fileNumber: employees.fileNumber })
          .from(employees)
          .where(eq(employees.iqamaNumber, String(user.national_id)))
          .limit(1);
        ownEmployeeFileNumber = ownRows[0]?.fileNumber ?? null;
      } catch (e) {
        ownEmployeeFileNumber = null;
      }
    }

    // Get total employee count (filtered for employee users)
    const totalEmployeesRows = ownEmployeeFileNumber
      ? await db
          .select({ count: sql<number>`count(*)` })
          .from(employees)
          .where(eq(employees.fileNumber, ownEmployeeFileNumber))
      : await db.select({ count: sql<number>`count(*)` }).from(employees);
    const totalEmployees = Number((totalEmployeesRows as any)[0]?.count ?? 0);

    // Get employees with current assignments (filtered for employee users)
    let currentlyAssigned = 0;
    if (ownEmployeeFileNumber) {
      // For employee users, check if they have any active assignments
      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(employeeAssignments)
        .innerJoin(employees, eq(employees.id, employeeAssignments.employeeId))
        .where(
          and(
            eq(employees.fileNumber, ownEmployeeFileNumber),
            eq(employeeAssignments.status, 'active')
          )
        );
      currentlyAssigned = Number((rows as any)[0]?.count ?? 0) > 0 ? 1 : 0;
    } else {
      const rows = await db
        .select({ count: sql<number>`count(distinct ${employeeAssignments.employeeId})` })
        .from(employeeAssignments)
        .where(eq(employeeAssignments.status, 'active'));
      currentlyAssigned = Number((rows as any)[0]?.count ?? 0);
    }

    // Count project assignments (filtered for employee users)
    let projectAssignments = 0;
    if (ownEmployeeFileNumber) {
      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(employeeAssignments)
        .innerJoin(employees, eq(employees.id, employeeAssignments.employeeId))
        .where(
          and(
            eq(employees.fileNumber, ownEmployeeFileNumber),
            eq(employeeAssignments.status, 'active'),
            eq(employeeAssignments.type, 'project')
          )
        );
      projectAssignments = Number((rows as any)[0]?.count ?? 0) > 0 ? 1 : 0;
    } else {
      const rows = await db
        .select({ count: sql<number>`count(distinct ${employeeAssignments.employeeId})` })
        .from(employeeAssignments)
        .where(
          and(eq(employeeAssignments.status, 'active'), eq(employeeAssignments.type, 'project'))
        );
      projectAssignments = Number((rows as any)[0]?.count ?? 0);
    }

    // Count rental assignments (filtered for employee users)
    let rentalAssignments = 0;
    const rentalTypes = ['rental', 'rental_item'] as const;
    if (ownEmployeeFileNumber) {
      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(employeeAssignments)
        .innerJoin(employees, eq(employees.id, employeeAssignments.employeeId))
        .where(
          and(
            eq(employees.fileNumber, ownEmployeeFileNumber),
            eq(employeeAssignments.status, 'active'),
            inArray(employeeAssignments.type, rentalTypes as unknown as string[])
          )
        );
      rentalAssignments = Number((rows as any)[0]?.count ?? 0) > 0 ? 1 : 0;
    } else {
      const rows = await db
        .select({ count: sql<number>`count(distinct ${employeeAssignments.employeeId})` })
        .from(employeeAssignments)
        .where(
          and(
            eq(employeeAssignments.status, 'active'),
            inArray(employeeAssignments.type, rentalTypes as unknown as string[])
          )
        );
      rentalAssignments = Number((rows as any)[0]?.count ?? 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        currentlyAssigned,
        projectAssignments,
        rentalAssignments,
      },
      message: 'Employee statistics retrieved successfully',
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch employee statistics. Please try refreshing the page.',
      },
      { status: 500 }
    );
  }
};

export const GET = withAuth(getEmployeeStatisticsHandler);
