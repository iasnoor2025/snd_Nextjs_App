import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const activeLeave = await prisma.employeeLeave.findFirst({
      where: {
        employee_id: employeeId,
        status: 'approved',
        start_date: {
          lte: today
        },
        end_date: {
          gte: today
        }
      }
    });

    // Get current employee status
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { status: true }
    });

    if (!employee) {
      return false;
    }

    let statusUpdated = false;

    if (activeLeave) {
      // Employee is currently on leave
      if (employee.status !== 'on_leave') {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { status: 'on_leave' }
        });
        statusUpdated = true;
      }
    } else {
      // Employee is not currently on leave
      if (employee.status === 'on_leave') {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { status: 'active' }
        });
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
    
    const activeLeave = await prisma.employeeLeave.findFirst({
      where: {
        employee_id: employeeId,
        status: 'approved',
        start_date: {
          lte: today
        },
        end_date: {
          gte: today
        }
      }
    });

    return !!activeLeave;
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
    const approvedLeaves = await prisma.employeeLeave.findMany({
      where: {
        employee_id: employeeId,
        status: 'approved'
      },
      orderBy: {
        start_date: 'desc'
      }
    });

    const currentLeave = approvedLeaves.find(leave => 
      leave.start_date <= today && leave.end_date >= today
    );

    const upcomingLeave = approvedLeaves.find(leave => 
      leave.start_date > today
    );

    const pastLeave = approvedLeaves.find(leave => 
      leave.end_date < today
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
