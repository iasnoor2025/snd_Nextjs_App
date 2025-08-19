import { db } from '@/lib/drizzle';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron service
    const authHeader = _request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0] as string; // YYYY-MM-DD format

    // Find all employees who should be on leave today
    const employeesOnLeave = await db
      .select({
        employeeId: employeeLeaves.employeeId,
        startDate: employeeLeaves.startDate,
        endDate: employeeLeaves.endDate,
      })
      .from(employeeLeaves)
      .where(
        and(
          eq(employeeLeaves.status, 'approved'),
          lte(employeeLeaves.startDate, todayStr),
          gte(employeeLeaves.endDate, todayStr)
        )
      );

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
        
      }
    }

    // Find all employees who are marked as on_leave but shouldn't be
    const employeesToReactivate = await db
      .select({
        id: employees.id,
        status: employees.status,
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

    // Update employees who should be active
    let activeUpdated = 0;
    for (const employee of employeesToReactivate) {
      try {
        await db.update(employees).set({ status: 'active' }).where(eq(employees.id, employee.id));
        activeUpdated++;
      } catch (error) {
        
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Employee status update completed',
      data: {
        onLeaveUpdated,
        activeUpdated,
        totalProcessed: onLeaveUpdated + activeUpdated,
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update employee statuses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
