import { NotificationService } from './notification-service';

/**
 * Helper functions to integrate approval notifications into your existing approval workflows
 *
 * Usage examples:
 *
 * 1. When a timesheet is submitted for approval:
 *    await notifyTimesheetApproval(managerEmail, employeeName, week, timesheetId);
 *
 * 2. When a leave request is submitted:
 *    await notifyLeaveApproval(managerEmail, employeeName, leaveType, startDate, leaveRequestId);
 *
 * 3. When an advance request is submitted:
 *    await notifyAdvanceApproval(managerEmail, employeeName, amount, reason, advanceRequestId);
 *
 * 4. When equipment is requested:
 *    await notifyEquipmentApproval(managerEmail, employeeName, equipmentType, equipmentRequestId);
 *
 * 5. When there are bulk items needing approval:
 *    await notifyBulkApproval(managerEmail, 'timesheets', 5, '/super-admin-approvals');
 */

export class ApprovalNotificationHelper {
  /**
   * Notify manager when a timesheet needs approval
   */
  static async notifyTimesheetApproval(
    managerEmail: string,
    employeeName: string,
    week: string,
    timesheetId: string
  ) {
    try {
      // Create notification in database
      await NotificationService.createTimesheetApprovalNotification(
        managerEmail,
        employeeName,
        week,
        timesheetId
      );

      // Show toast notification
      NotificationService.info({
        title: 'Timesheet Approval Required',
        message: `${employeeName}'s timesheet for ${week} needs your approval`,
        actionUrl: '/modules/timesheet-management',
      });

    } catch (error) {
      
    }
  }

  /**
   * Notify manager when a leave request needs approval
   */
  static async notifyLeaveApproval(
    managerEmail: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    leaveRequestId: string
  ) {
    try {
      // Create notification in database
      await NotificationService.createLeaveApprovalNotification(
        managerEmail,
        employeeName,
        leaveType,
        startDate,
        leaveRequestId
      );

      // Show toast notification
      NotificationService.info({
        title: 'Leave Request Approval',
        message: `${employeeName} requested ${leaveType} leave starting ${startDate}`,
        actionUrl: '/modules/leave-management',
      });

    } catch (error) {
      
    }
  }

  /**
   * Notify manager when an advance request needs approval
   */
  static async notifyAdvanceApproval(
    managerEmail: string,
    employeeName: string,
    amount: number,
    reason: string,
    advanceRequestId: string
  ) {
    try {
      // Create notification in database
      await NotificationService.createAdvanceApprovalNotification(
        managerEmail,
        employeeName,
        amount,
        reason,
        advanceRequestId
      );

      // Show toast notification
      NotificationService.info({
        title: 'Advance Request Approval',
        message: `${employeeName} requested $${amount} advance for ${reason}`,
        actionUrl: '/modules/payroll-management',
      });

    } catch (error) {
      
    }
  }

  /**
   * Notify manager when equipment is requested
   */
  static async notifyEquipmentApproval(
    managerEmail: string,
    employeeName: string,
    equipmentType: string,
    equipmentRequestId: string
  ) {
    try {
      // Create notification in database
      await NotificationService.createEquipmentApprovalNotification(
        managerEmail,
        employeeName,
        equipmentType,
        equipmentRequestId
      );

      // Show toast notification
      NotificationService.info({
        title: 'Equipment Request Approval',
        message: `${employeeName} requested ${equipmentType}`,
        actionUrl: '/modules/equipment-management',
      });

    } catch (error) {
      
    }
  }

  /**
   * Notify manager when there are bulk items needing approval
   */
  static async notifyBulkApproval(
    managerEmail: string,
    itemType: string,
    count: number,
    actionUrl: string
  ) {
    try {
      // Create notification in database
      await NotificationService.createBulkApprovalNotification(
        managerEmail,
        itemType,
        count,
        actionUrl
      );

      // Show toast notification
      NotificationService.warning({
        title: 'Bulk Approval Required',
        message: `You have ${count} ${itemType} items waiting for approval`,
        actionUrl,
      });

    } catch (error) {
      
    }
  }

  /**
   * Notify employee when their request is approved
   */
  static async notifyApprovalGranted(employeeEmail: string, itemType: string, itemName: string) {
    try {
      // Show success toast
      NotificationService.success({
        title: 'Approval Granted',
        message: `Your ${itemType} "${itemName}" has been approved!`,
      });

    } catch (error) {
      
    }
  }

  /**
   * Notify employee when their request is rejected
   */
  static async notifyApprovalRejected(
    employeeEmail: string,
    itemType: string,
    itemName: string,
    reason?: string
  ) {
    try {
      // Show error toast
      NotificationService.error({
        title: 'Approval Rejected',
        message: reason
          ? `Your ${itemType} "${itemName}" was rejected: ${reason}`
          : `Your ${itemType} "${itemName}" was rejected`,
      });

    } catch (error) {
      
    }
  }
}
