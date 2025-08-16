import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employees, employeeLeaves } from '@/lib/drizzle/schema';
import { and, eq, lte, gte, sql } from 'drizzle-orm';

export async function $1(_request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron service
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting employee status update cron job...');

    // Get current date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0] as string; // YYYY-MM-DD format

    // Find all employees who should be on leave today
    const employeesOnLeave = await db
      .select({
        employeeId: employeeLeaves.employeeId,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate
      })
      .from(employeeLeaves)
      .where(
        and(
          eq(employeeLeaves.status, 'approved'),
          lte(employeeLeaves.startDate, todayStr),
          gte(employeeLeaves.endDate, todayStr)
        )
      );

    console.log(`Found ${employeesOnLeave.length} employees on leave today`);

    // Update employees who should be on leave
    let onLeaveUpdated = 0;
    for (const leave of employeesOnLeave) {
      try {
        await db
          .update(employees)
          .set({ status: 'on_leave' })
          .where(eq(employees.id, leave.employeeId));
        onLeaveUpdated++;
      } catch (error) {
        console.error(`Error updating employee ${leave.employeeId} to on_leave:`, error);
      }
    }

    // Find all employees who are marked as on_leave but shouldn't be
    const employeesToReactivate = await db
      .select({
        id: employees.id,
        status: employees.status
      })
      .from(employees)
      .where(
        and(
          eq(employees.status, 'on_leave'),
          sql`NOT EXISTS (
            SELECT 1 FROM employee_leaves 
            WHERE employee_leaves.employee_id = employees.id 
            AND employee_leaves.status = 'approved'
            AND employee_leaves.start_date <= ${todayStr}
            AND employee_leaves.end_date >= ${todayStr}
          )`
        )
      );

    console.log(`Found ${employeesToReactivate.length} employees to reactivate`);

    // Update employees who should be active
    let activeUpdated = 0;
    for (const employee of employeesToReactivate) {
      try {
        await db
          .update(employees)
          .set({ status: 'active' })
          .where(eq(employees.id, employee.id));
        activeUpdated++;
      } catch (error) {
        console.error(`Error updating employee ${employee.id} to active:`, error);
      }
    }

    console.log(`Cron job completed: ${onLeaveUpdated} employees set to on_leave, ${activeUpdated} employees set to active`);

    return NextResponse.json({
      success: true,
      message: 'Employee status update completed',
      data: {
        onLeaveUpdated,
        activeUpdated,
        totalProcessed: onLeaveUpdated + activeUpdated
      }
    });

  } catch (error) {
    console.error('Error in employee status cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update employee statuses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
