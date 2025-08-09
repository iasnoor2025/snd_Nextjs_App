import { db } from '@/lib/db';
import { employeeLeaves, employees } from '@/lib/drizzle/schema';
import { and, eq, gte, lte } from 'drizzle-orm';

/**
 * Check if an employee is currently on leave and update their status accordingly
 * @param employeeId - The employee ID to check
 * @returns Promise<boolean> - True if status was updated, false otherwise
 */
export async function updateEmployeeStatusBasedOnLeave(employeeId: number): Promise<boolean> {
  try {
    // Get current date
    const today = new Date();
    
    // Find any approved leave that is currently active (start_date <= today <= end_date)
    const activeLeave = await db
      .select()
      .from(employeeLeaves)
      .where(
        and(
          eq(employeeLeaves.employeeId, employeeId),
          eq(employeeLeaves.status, 'approved'),
          lte(employeeLeaves.startDate, today.toISOString()),
          gte(employeeLeaves.endDate, today.toISOString())
        )
      )
      .limit(1);

    // Get current employee status
    const emp = await db
      .select({ status: employees.status })
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);
    const employee = emp[0];

    if (!employee) {
      return false;
    }

    let statusUpdated = false;

    if (activeLeave.length > 0) {
      // Employee is currently on leave
      if (employee.status !== 'on_leave') {
        await db.update(employees).set({ status: 'on_leave' }).where(eq(employees.id, employeeId));
        statusUpdated = true;
      }
    } else {
      // Employee is not currently on leave
      if (employee.status === 'on_leave') {
        await db.update(employees).set({ status: 'active' }).where(eq(employees.id, employeeId));
        statusUpdated = true;
      }
    }

    return statusUpdated;
  } catch (error) {
    console.error('Error updating employee status based on leave:', error);
    return false;
  }
}

/**
 * Check if an employee has any approved leave that is currently active
 * @param employeeId - The employee ID to check
 * @returns Promise<boolean> - True if employee is currently on leave
 */
export async function isEmployeeCurrentlyOnLeave(employeeId: number): Promise<boolean> {
  try {
    const today = new Date();
    
    const activeLeave = await db
      .select()
      .from(employeeLeaves)
      .where(
        and(
          eq(employeeLeaves.employeeId, employeeId),
          eq(employeeLeaves.status, 'approved'),
          lte(employeeLeaves.startDate, today.toISOString()),
          gte(employeeLeaves.endDate, today.toISOString())
        )
      )
      .limit(1);

    return activeLeave.length > 0;
  } catch (error) {
    console.error('Error checking if employee is on leave:', error);
    return false;
  }
}

/**
 * Get the current leave status for an employee
 * @param employeeId - The employee ID to check
 * @returns Promise<object> - Object with leave status information
 */
export async function getEmployeeLeaveStatus(employeeId: number) {
  try {
    const today = new Date();
    
    // Get all approved leaves for the employee
    const approvedLeaves = await db
      .select()
      .from(employeeLeaves)
      .where(and(eq(employeeLeaves.employeeId, employeeId), eq(employeeLeaves.status, 'approved')));

    const currentLeave = approvedLeaves.find(leave => 
      (leave as any).startDate <= today.toISOString() && (leave as any).endDate >= today.toISOString()
    );

    const upcomingLeave = approvedLeaves.find(leave => 
      (leave as any).startDate > today.toISOString()
    );

    const pastLeave = approvedLeaves.find(leave => 
      (leave as any).endDate < today.toISOString()
    );

    return {
      isCurrentlyOnLeave: !!currentLeave,
      currentLeave,
      upcomingLeave,
      pastLeave,
      totalApprovedLeaves: approvedLeaves.length
    };
  } catch (error) {
    console.error('Error getting employee leave status:', error);
    return {
      isCurrentlyOnLeave: false,
      currentLeave: null,
      upcomingLeave: null,
      pastLeave: null,
      totalApprovedLeaves: 0
    };
  }
}
