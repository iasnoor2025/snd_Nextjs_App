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
   * Example: When a timesheet is submitted for approval
   * Add this to your timesheet submission API route
   */
  static async onTimesheetSubmitted(
    timesheetId: string,
    employeeName: string,
    week: string,
    managerEmail: string
  ) {
    // Send notification to manager that approval is needed
    await ApprovalNotificationHelper.notifyTimesheetApproval(
      managerEmail,
      employeeName,
      week,
      timesheetId
    );
  }

  /**
   * Example: When a timesheet is approved at any stage
   * Add this to your timesheet approval API route
   */
  static async onTimesheetApproved(
    timesheetId: string,
    employeeName: string,
    week: string,
    approvalStage: string,
    employeeEmail: string
  ) {
    // Notify employee that their timesheet was approved
    await ApprovalNotificationHelper.notifyApprovalGranted(
      employeeEmail,
      'timesheet',
      `Week ${week} (${approvalStage} stage)`
    );

    // If this is not the final approval stage, notify the next approver
    if (approvalStage !== 'manager') {
      const nextStage = this.getNextApprovalStage(approvalStage);
      const nextApproverEmail = await this.getNextApproverEmail(nextStage);
      
      if (nextApproverEmail) {
        await ApprovalNotificationHelper.notifyTimesheetApproval(
          nextApproverEmail,
          employeeName,
          week,
          timesheetId
        );
      }
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
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : '';
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
    
    console.log(`Getting next approver for stage: ${stage}`);
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
