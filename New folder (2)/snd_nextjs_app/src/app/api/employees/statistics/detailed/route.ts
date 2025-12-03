import { db } from '@/lib/db';
import { employeeAssignments, employees, projectManpower, employeeLeaves } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, eq, inArray, sql, gte, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const getDetailedStatisticsHandler = async () => {
  try {
    console.log('\n🔍 DETAILED EMPLOYEE STATISTICS');
    console.log('='.repeat(80));

    // 1. Total and status breakdown
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(employees);
    const totalEmployees = Number(totalResult[0]?.count ?? 0);

    const statusBreakdown = await db
      .select({
        status: employees.status,
        count: sql<number>`count(*)`
      })
      .from(employees)
      .groupBy(employees.status);

    console.log(`\nTotal Employees: ${totalEmployees}`);
    console.log('\nStatus Breakdown:');
    statusBreakdown.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

    // 2. Active employees
    const activeResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.status, 'active'));
    const activeEmployees = Number(activeResult[0]?.count ?? 0);
    console.log(`\nActive Employees: ${activeEmployees}`);

    // 3. External employees
    const externalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.isExternal, true));
    const externalEmployees = Number(externalResult[0]?.count ?? 0);
    console.log(`External Employees: ${externalEmployees}`);

    // 4. Assignment analysis
    console.log('\n--- ASSIGNMENT ANALYSIS ---');

    // Get all employees
    const allEmployees = await db.select({ id: employees.id }).from(employees);
    const employeeIds = allEmployees.map(emp => emp.id);

    // employeeAssignments breakdown
    const assignmentTypes = await db
      .select({
        type: employeeAssignments.type,
        count: sql<number>`count(DISTINCT ${employeeAssignments.employeeId})`
      })
      .from(employeeAssignments)
      .where(
        and(
          eq(employeeAssignments.status, 'active'),
          sql`${employeeAssignments.endDate} IS NULL OR ${employeeAssignments.endDate} > NOW()`
        )
      )
      .groupBy(employeeAssignments.type);

    console.log('\nemployeeAssignments table (by type):');
    assignmentTypes.forEach(row => {
      console.log(`  ${row.type}: ${row.count} employees`);
    });

    // projectManpower count
    const projectManpowerResult = await db
      .select({
        count: sql<number>`count(DISTINCT ${projectManpower.employeeId})`
      })
      .from(projectManpower)
      .where(
        and(
          eq(projectManpower.status, 'active'),
          sql`${projectManpower.endDate} IS NULL OR ${projectManpower.endDate} > NOW()`
        )
      );
    
    const projectManpowerCount = Number(projectManpowerResult[0]?.count ?? 0);
    console.log(`\nprojectManpower table: ${projectManpowerCount} employees`);

    // Combined currently assigned
    const assignedFromBothTables = await db
      .select({
        employeeId: sql<number>`COALESCE(${employeeAssignments.employeeId}, ${projectManpower.employeeId})`
      })
      .from(employeeAssignments)
      .fullJoin(projectManpower, eq(employeeAssignments.employeeId, projectManpower.employeeId))
      .where(
        sql`(
          (${employeeAssignments.status} = 'active' AND (${employeeAssignments.endDate} IS NULL OR ${employeeAssignments.endDate} > NOW()))
          OR
          (${projectManpower.status} = 'active' AND (${projectManpower.endDate} IS NULL OR ${projectManpower.endDate} > NOW()))
        )`
      );

    const uniqueAssigned = new Set(assignedFromBothTables.map(r => r.employeeId));
    console.log(`\nTotal Currently Assigned (unique): ${uniqueAssigned.size} employees`);

    // Employees on leave
    const today = new Date().toISOString().split('T')[0];
    const onLeaveResult = await db
      .select({
        count: sql<number>`count(DISTINCT ${employeeLeaves.employeeId})`
      })
      .from(employeeLeaves)
      .where(
        and(
          eq(employeeLeaves.status, 'approved'),
          lte(employeeLeaves.startDate, today),
          gte(employeeLeaves.endDate, today)
        )
      );
    
    const employeesOnLeave = Number(onLeaveResult[0]?.count ?? 0);
    console.log(`\nEmployees on Leave: ${employeesOnLeave}`);

    // Calculate unassigned active employees
    const unassignedActive = activeEmployees - uniqueAssigned.size;
    console.log(`\nUnassigned Active Employees: ${unassignedActive} (${activeEmployees} active - ${uniqueAssigned.size} assigned)`);

    console.log('\n' + '='.repeat(80));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees: totalEmployees - activeEmployees,
          externalEmployees,
          currentlyAssigned: uniqueAssigned.size,
          unassignedActive,
          employeesOnLeave,
        },
        statusBreakdown: statusBreakdown.map(row => ({
          status: row.status,
          count: Number(row.count)
        })),
        assignments: {
          byType: assignmentTypes.map(row => ({
            type: row.type,
            count: Number(row.count)
          })),
          projectManpower: projectManpowerCount,
          totalUnique: uniqueAssigned.size,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching detailed statistics:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch detailed employee statistics.',
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.employee.read)(getDetailedStatisticsHandler);

