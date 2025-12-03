import { ApprovalNotificationHelper } from './approval-notification-helper';

/**
 * Example of how to integrate approval notifications into your existing timesheet approval workflow
 *
 * This file shows the key points where you should add notification calls in your existing API routes.
 *
 * IMPORTANT: This is just an example - don't copy this file directly.
 * Instead, use the patterns shown here to modify your existing API routes.
 */

export class TimesheetApprovalExample {
  /**
   * Approve timesheet at a specific stage
   */
  static async approveTimesheet(
    timesheetId: string,
    approverId: string,
    stage: string,
    comments?: string
  ): Promise<{ success: boolean; message: string; nextStage?: string }> {
    try {
      // Get the next approval stage
      const nextStage = this.getNextApprovalStage(stage);

      // Update timesheet approval status
      // This would typically update the database

      return {
        success: true,
        message: `Timesheet approved at ${stage} stage`,
        nextStage,
      };
    } catch (error) {
      
      return {
        success: false,
        message: 'Failed to approve timesheet',
      };
    }
  }

  /**
   * Example: When a timesheet is rejected
   * Add this to your timesheet rejection API route
   */
  static async onTimesheetRejected(
    timesheetId: string,
    employeeName: string,
    week: string,
    reason: string,
    employeeEmail: string
  ) {
    // Notify employee that their timesheet was rejected
    await ApprovalNotificationHelper.notifyApprovalRejected(
      employeeEmail,
      'timesheet',
      `Week ${week}`,
      reason
    );
  }

  /**
   * Helper: Get the next approval stage
   */
  private static getNextApprovalStage(currentStage: string): string {
    const stages = ['foreman', 'incharge', 'checking', 'manager'];
    const currentIndex = stages.indexOf(currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : 'manager';
  }

  /**
   * Helper: Get the email of the next approver
   * You'll need to implement this based on your user management system
   */
  private static async getNextApproverEmail(stage: string): Promise<string | null> {
    // TODO: Implement this based on your user/role system
    // Example:
    // const approver = await getUserByRole(stage);
    // return approver?.email || null;

    return null; // Placeholder
  }
}

/**
 * INTEGRATION GUIDE FOR YOUR EXISTING API ROUTES:
 *
 * 1. In your timesheet submission API route (/api/timesheets/submit):
 *    - After successfully saving the timesheet
 *    - Call: TimesheetApprovalExample.onTimesheetSubmitted(timesheetId, employeeName, week, managerEmail)
 *
 * 2. In your timesheet approval API route (/api/timesheets/approve):
 *    - After successfully updating the timesheet status
 *    - Call: TimesheetApprovalExample.onTimesheetApproved(timesheetId, employeeName, week, approvalStage, employeeEmail)
 *
 * 3. In your timesheet rejection API route (/api/timesheets/reject):
 *    - After successfully rejecting the timesheet
 *    - Call: TimesheetApprovalExample.onTimesheetRejected(timesheetId, employeeName, week, reason, employeeEmail)
 *
 * 4. For bulk operations (/api/timesheets/bulk-approve):
 *    - After processing multiple timesheets
 *    - Call: ApprovalNotificationHelper.notifyBulkApproval(managerEmail, 'timesheets', count, '/modules/timesheet-management')
 *
 * EXAMPLE MODIFICATION TO YOUR EXISTING ROUTE:
 *
 * // In your existing approve route, add this after the timesheet update:
 *
 * // Send approval notification
 * await TimesheetApprovalExample.onTimesheetApproved(
 *   timesheetId,
 *   updatedTimesheet.employee.user.name,
 *   updatedTimesheet.week,
 *   approvalStage,
 *   updatedTimesheet.employee.user.email
 * );
 *
 * // If there's a next approval stage, notify the next approver
 * if (approvalStage !== 'manager') {
 *   const nextStage = TimesheetApprovalExample.getNextApprovalStage(approvalStage);
 *   // ... implement next approver logic
 * }
 */
