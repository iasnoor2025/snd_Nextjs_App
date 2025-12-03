import { db } from '@/lib/db';
import { employeeAssignments } from '@/lib/drizzle/schema';
import { and, eq, ne, lt, desc } from 'drizzle-orm';

export interface Assignment {
  id: number;
  employeeId: number;
  name: string;
  type: string;
  location?: string;
  startDate: string;
  endDate?: string;
  status: string;
  notes?: string;
  projectId?: number;
  rentalId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentData {
  employeeId: number;
  name: string;
  type?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  status?: string;
  notes?: string;
  projectId?: number;
  rentalId?: number;
}

export interface UpdateAssignmentData {
  name?: string;
  type?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  notes?: string;
  projectId?: number;
  rentalId?: number;
}

export class AssignmentService {
  /**
   * Create a new assignment and handle previous assignment completion
   */
  static async createAssignment(data: CreateAssignmentData): Promise<Assignment> {
    const {
      employeeId,
      name,
      type = 'manual',
      location = '',
      startDate,
      endDate = null,
      status = 'active',
      notes = '',
      projectId = null,
      rentalId = null,
    } = data;

    // Create the new assignment
    const [newAssignment] = await db
      .insert(employeeAssignments)
      .values({
        employeeId,
        name,
        type,
        location,
        startDate,
        endDate,
        status,
        notes,
        projectId,
        rentalId,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    // If this is a new manual assignment, complete the previous active assignment
    if (type === 'manual' && status === 'active') {
      await this.completePreviousAssignment(employeeId, startDate, newAssignment.id);
    }

    return newAssignment;
  }

  /**
   * Update an assignment
   */
  static async updateAssignment(
    assignmentId: number,
    employeeId: number,
    data: UpdateAssignmentData
  ): Promise<Assignment> {
    // Normalize empty strings to null/undefined where appropriate
    const normalizedStartDate =
      data.startDate === '' ? undefined : data.startDate;
    const normalizedEndDate =
      data.endDate === '' ? null : data.endDate;

    // Validate required fields when present
    if (normalizedStartDate !== undefined && isNaN(Date.parse(normalizedStartDate))) {
      throw new Error('Invalid startDate');
    }
    if (
      normalizedEndDate !== undefined &&
      normalizedEndDate !== null &&
      isNaN(Date.parse(normalizedEndDate))
    ) {
      throw new Error('Invalid endDate');
    }
    const updateData: any = {
      updatedAt: new Date().toISOString().split('T')[0],
    };

    // Only include fields that are explicitly provided to avoid setting columns to undefined
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.location !== undefined) updateData.location = data.location;
    if (normalizedStartDate !== undefined) updateData.startDate = normalizedStartDate;
    if (normalizedEndDate !== undefined) updateData.endDate = normalizedEndDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    // For nullable FKs, treat undefined as "do not touch", but allow explicit null
    if (data.projectId !== undefined) updateData.projectId = data.projectId ?? null;
    if (data.rentalId !== undefined) updateData.rentalId = data.rentalId ?? null;

    // If status is being set to completed and no end date is provided,
    // set it to one day before the assignment start date
    if (data.status === 'completed' && !normalizedEndDate && normalizedStartDate) {
      const endDate = new Date(normalizedStartDate);
      endDate.setDate(endDate.getDate() - 1);
      updateData.endDate = endDate.toISOString().split('T')[0];
    }

    const [updatedAssignment] = await db
      .update(employeeAssignments)
      .set(updateData)
      .where(
        and(
          eq(employeeAssignments.id, assignmentId),
          eq(employeeAssignments.employeeId, employeeId)
        )
      )
      .returning();

    // After updating an active manual assignment, ensure the immediately previous
    // assignment ends one day before the (possibly updated) start date
    if (
      updatedAssignment &&
      updatedAssignment.type === 'manual' &&
      updatedAssignment.status === 'active' &&
      updatedAssignment.startDate
    ) {
      const updatedStartStr =
        typeof updatedAssignment.startDate === 'string'
          ? updatedAssignment.startDate
          : new Date(updatedAssignment.startDate).toISOString().split('T')[0];

      await this.completePreviousAssignment(
        employeeId,
        updatedStartStr,
        updatedAssignment.id
      );
    }

    return updatedAssignment;
  }

  /**
   * Delete an assignment and reactivate the previous completed assignment if needed
   */
  static async deleteAssignment(assignmentId: number, employeeId: number): Promise<{
    deletedAssignment: Assignment;
    reactivatedAssignment?: Assignment;
  }> {
    // Get the assignment to be deleted
    const [assignmentToDelete] = await db
      .select()
      .from(employeeAssignments)
      .where(
        and(
          eq(employeeAssignments.id, assignmentId),
          eq(employeeAssignments.employeeId, employeeId)
        )
      )
      .limit(1);

    if (!assignmentToDelete) {
      throw new Error('Assignment not found');
    }

    let reactivatedAssignment: Assignment | undefined;

    // If this was an active assignment, reactivate the most recent completed assignment
    if (assignmentToDelete.status === 'active') {
      reactivatedAssignment = await this.reactivatePreviousAssignment(employeeId);
    }

    // Delete the assignment
    await db
      .delete(employeeAssignments)
      .where(eq(employeeAssignments.id, assignmentId));

    return {
      deletedAssignment: assignmentToDelete,
      reactivatedAssignment,
    };
  }

  /**
   * Get assignments for an employee
   */
  static async getEmployeeAssignments(employeeId: number): Promise<Assignment[]> {
    return await db
      .select()
      .from(employeeAssignments)
      .where(eq(employeeAssignments.employeeId, employeeId))
      .orderBy(desc(employeeAssignments.createdAt));
  }

  /**
   * Complete assignments for vacation settlement
   */
  static async completeAssignmentsForVacation(
    employeeId: number,
    vacationStartDate: string
  ): Promise<void> {
    // Set end date to one day before vacation starts
    const assignmentEnd = new Date(vacationStartDate);
    assignmentEnd.setDate(assignmentEnd.getDate() - 1);
    const assignmentEndStr = assignmentEnd.toISOString().split('T')[0];

    await db
      .update(employeeAssignments)
      .set({
        status: 'completed',
        endDate: assignmentEndStr,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          ne(employeeAssignments.status, 'completed')
        )
      );
  }

  /**
   * Complete assignments for exit settlement
   */
  static async completeAssignmentsForExit(
    employeeId: number,
    lastWorkingDate: string
  ): Promise<void> {
    await db
      .update(employeeAssignments)
      .set({
        status: 'completed',
        endDate: lastWorkingDate,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          ne(employeeAssignments.status, 'completed')
        )
      );
  }

  /**
   * Restore assignments after vacation settlement deletion
   */
  static async restoreAssignmentsAfterVacationDeletion(
    employeeId: number,
    vacationStartDate: string
  ): Promise<void> {
    const assignmentEndDate = new Date(vacationStartDate);
    assignmentEndDate.setDate(assignmentEndDate.getDate() - 1);
    const assignmentEndDateStr = assignmentEndDate.toISOString().split('T')[0];

    await db
      .update(employeeAssignments)
      .set({
        status: 'active',
        endDate: null,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          eq(employeeAssignments.status, 'completed'),
          eq(employeeAssignments.endDate, assignmentEndDateStr)
        )
      );
  }

  /**
   * Restore assignments after exit settlement deletion
   */
  static async restoreAssignmentsAfterExitDeletion(
    employeeId: number,
    lastWorkingDate: string
  ): Promise<void> {
    await db
      .update(employeeAssignments)
      .set({
        status: 'active',
        endDate: null,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          eq(employeeAssignments.status, 'completed'),
          eq(employeeAssignments.endDate, lastWorkingDate)
        )
      );
  }

  /**
   * Private helper: Complete the previous active assignment
   */
  private static async completePreviousAssignment(
    employeeId: number,
    newStartDate: string,
    newAssignmentId: number
  ): Promise<void> {
    // Find the most recent previous assignment (any status) that started before this one
    const prevAssignment = await db
      .select()
      .from(employeeAssignments)
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          lt(employeeAssignments.startDate, newStartDate),
          ne(employeeAssignments.id, newAssignmentId)
        )
      )
      .orderBy(desc(employeeAssignments.startDate))
      .limit(1);

    if (prevAssignment[0]) {
      // Set end date to one day before the new assignment's start date
      const endDate = new Date(newStartDate);
      endDate.setDate(endDate.getDate() - 1);
      const endDateStr = endDate.toISOString().split('T')[0];

      await db
        .update(employeeAssignments)
        .set({
          status: 'completed',
          endDate: endDateStr,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(eq(employeeAssignments.id, prevAssignment[0].id));
    }
  }

  /**
   * Private helper: Reactivate the most recent completed assignment
   */
  private static async reactivatePreviousAssignment(
    employeeId: number
  ): Promise<Assignment | undefined> {
    // Find the most recent completed assignment for this employee
    const completedAssignments = await db
      .select()
      .from(employeeAssignments)
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          eq(employeeAssignments.status, 'completed')
        )
      )
      .orderBy(desc(employeeAssignments.createdAt))
      .limit(1);

    if (completedAssignments[0]) {
      const mostRecentCompleted = completedAssignments[0];

      // Update the most recent completed assignment to active and remove end date
      await db
        .update(employeeAssignments)
        .set({
          status: 'active',
          endDate: null,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(eq(employeeAssignments.id, mostRecentCompleted.id));

      return {
        ...mostRecentCompleted,
        status: 'active',
        endDate: null,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }

    return undefined;
  }
}
