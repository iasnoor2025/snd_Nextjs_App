import { toast } from 'sonner';
// import { notifications } from '@/lib/drizzle/schema';

export interface NotificationOptions {
  title: string;
  message: string;
  actionUrl?: string | undefined;
  duration?: number;
  dismissible?: boolean;
}

export class NotificationService {
  // Success notifications
  static success(options: NotificationOptions) {
    const toastOptions = {
      description: options.message,
      duration: options.duration || 4000,
      dismissible: options.dismissible !== false,
      action: options.actionUrl
        ? {
            label: 'View',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = options.actionUrl!;
              }
            },
          }
        : undefined,
    };

    toast.success(options.title, toastOptions);
  }

  // Error notifications
  static error(options: NotificationOptions) {
    const toastOptions = {
      description: options.message,
      duration: options.duration || 6000,
      dismissible: options.dismissible !== false,
      action: options.actionUrl
        ? {
            label: 'View',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = options.actionUrl!;
              }
            },
          }
        : undefined,
    };

    toast.error(options.title, toastOptions);
  }

  // Warning notifications
  static warning(options: NotificationOptions) {
    const toastOptions = {
      description: options.message,
      duration: options.duration || 5000,
      dismissible: options.dismissible !== false,
      action: options.actionUrl
        ? {
            label: 'View',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = options.actionUrl!;
              }
            },
          }
        : undefined,
    };

    toast.warning(options.title, toastOptions);
  }

  // Info notifications
  static info(options: NotificationOptions) {
    const toastOptions = {
      description: options.message,
      duration: options.duration || 4000,
      dismissible: options.dismissible !== false,
      action: options.actionUrl
        ? {
            label: 'View',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = options.actionUrl!;
              }
            },
          }
        : undefined,
    };

    toast.info(options.title, toastOptions);
  }

  // Promise-based notifications
  static promise<T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    }
  ) {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  }

  // Custom toast with any configuration
  static custom(message: string, options?: any) {
    return toast(message, options);
  }

  // Dismiss all toasts
  static dismissAll() {
    toast.dismiss();
  }

  // Dismiss specific toast
  static dismiss(toastId: string | number) {
    toast.dismiss(toastId);
  }

  // Create approval notification in database
  static async createApprovalNotification(data: {
    userEmail: string;
    type:
      | 'timesheet_approval'
      | 'leave_approval'
      | 'advance_approval'
      | 'equipment_approval'
      | 'bulk_approval';
    title: string;
    message: string;
    data?: any;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high';
  }) {
    try {
      // Notifications table doesn't exist in schema - commenting out database operation
      // const result = await db.insert(notifications).values({
      //   type: 'info',
      //   title: data.title,
      //   message: data.message,
      //   data: data.data || {},
      //   actionUrl: data.actionUrl,
      //   priority: data.priority || 'medium',
      //   userEmail: data.userEmail,
      //   timestamp: new Date(),
      //   read: false,
      // }).returning();

      // Return a mock result for now
      return {
        id: Date.now(),
        type: 'info',
        title: data.title,
        message: data.message,
        data: data.data || {},
        actionUrl: data.actionUrl,
        priority: data.priority || 'medium',
        userEmail: data.userEmail,
        timestamp: new Date(),
        read: false,
      };
    } catch (error) {
      console.error('Failed to create approval notification:', error);
      throw error;
    }
  }

  // Create timesheet approval notification
  static async createTimesheetApprovalNotification(
    managerEmail: string,
    employeeName: string,
    week: string,
    timesheetId: string
  ) {
    return this.createApprovalNotification({
      userEmail: managerEmail,
      type: 'timesheet_approval',
      title: 'Timesheet Approval Required',
      message: `${employeeName}'s timesheet for ${week} needs your approval`,
      data: {
        employee_name: employeeName,
        week,
        timesheet_id: timesheetId,
        request_type: 'timesheet_approval',
      },
      actionUrl: `/modules/timesheet-management`,
      priority: 'high',
    });
  }

  // Create leave approval notification
  static async createLeaveApprovalNotification(
    managerEmail: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    leaveRequestId: string
  ) {
    return this.createApprovalNotification({
      userEmail: managerEmail,
      type: 'leave_approval',
      title: 'Leave Request Approval',
      message: `${employeeName} requested ${leaveType} leave starting ${startDate}`,
      data: {
        employee_name: employeeName,
        leave_type: leaveType,
        start_date: startDate,
        leave_request_id: leaveRequestId,
        request_type: 'leave_approval',
      },
      actionUrl: `/modules/leave-management`,
      priority: 'medium',
    });
  }

  // Create advance approval notification
  static async createAdvanceApprovalNotification(
    managerEmail: string,
    employeeName: string,
    amount: number,
    reason: string,
    advanceRequestId: string
  ) {
    return this.createApprovalNotification({
      userEmail: managerEmail,
      type: 'advance_approval',
      title: 'Advance Request Approval',
      message: `${employeeName} requested $${amount} advance for ${reason}`,
      data: {
        employee_name: employeeName,
        amount,
        reason,
        advance_request_id: advanceRequestId,
        request_type: 'advance_approval',
      },
      actionUrl: `/modules/payroll-management`,
      priority: 'high',
    });
  }

  // Create equipment approval notification
  static async createEquipmentApprovalNotification(
    managerEmail: string,
    employeeName: string,
    equipmentType: string,
    equipmentRequestId: string
  ) {
    return this.createApprovalNotification({
      userEmail: managerEmail,
      type: 'equipment_approval',
      title: 'Equipment Request Approval',
      message: `${employeeName} requested ${equipmentType}`,
      data: {
        employee_name: employeeName,
        equipment_type: equipmentType,
        equipment_request_id: equipmentRequestId,
        request_type: 'equipment_approval',
      },
      actionUrl: `/modules/equipment-management`,
      priority: 'medium',
    });
  }

  // Create bulk approval notification
  static async createBulkApprovalNotification(
    managerEmail: string,
    itemType: string,
    count: number,
    actionUrl: string
  ) {
    return this.createApprovalNotification({
      userEmail: managerEmail,
      type: 'bulk_approval',
      title: 'Bulk Approval Required',
      message: `You have ${count} ${itemType} items waiting for approval`,
      data: {
        count,
        item_type: itemType,
        request_type: 'bulk_approval',
      },
      actionUrl,
      priority: 'high',
    });
  }
}

// Convenience functions for common use cases
export const notify = {
  // Employee-related notifications
  employeeCreated: (employeeName: string) => {
    NotificationService.success({
      title: 'Employee Created',
      message: `${employeeName} has been successfully added to the system.`,
      actionUrl: '/modules/employee-management',
    });
  },

  employeeUpdated: (employeeName: string) => {
    NotificationService.success({
      title: 'Employee Updated',
      message: `${employeeName}'s information has been successfully updated.`,
      actionUrl: '/modules/employee-management',
    });
  },

  employeeDeleted: (employeeName: string) => {
    NotificationService.warning({
      title: 'Employee Deleted',
      message: `${employeeName} has been removed from the system.`,
    });
  },

  // Timesheet notifications
  timesheetSubmitted: () => {
    NotificationService.success({
      title: 'Timesheet Submitted',
      message: 'Your timesheet has been submitted successfully and is pending approval.',
      actionUrl: '/modules/timesheet-management',
    });
  },

  timesheetApproved: () => {
    NotificationService.success({
      title: 'Timesheet Approved',
      message: 'Your timesheet has been approved by your supervisor.',
      actionUrl: '/modules/timesheet-management',
    });
  },

  timesheetRejected: (reason?: string) => {
    NotificationService.error({
      title: 'Timesheet Rejected',
      message: reason || 'Your timesheet has been rejected. Please review and resubmit.',
      actionUrl: '/modules/timesheet-management',
    });
  },

  // Leave request notifications
  leaveRequestSubmitted: () => {
    NotificationService.info({
      title: 'Leave Request Submitted',
      message: 'Your leave request has been submitted and is pending approval.',
      actionUrl: '/modules/leave-management',
    });
  },

  leaveRequestApproved: () => {
    NotificationService.success({
      title: 'Leave Request Approved',
      message: 'Your leave request has been approved.',
      actionUrl: '/modules/leave-management',
    });
  },

  leaveRequestRejected: (reason?: string) => {
    NotificationService.error({
      title: 'Leave Request Rejected',
      message: reason || 'Your leave request has been rejected.',
      actionUrl: '/modules/leave-management',
    });
  },

  // Equipment notifications
  equipmentAssigned: (equipmentName: string) => {
    NotificationService.success({
      title: 'Equipment Assigned',
      message: `${equipmentName} has been assigned to you.`,
      actionUrl: '/modules/equipment-management',
    });
  },

  equipmentReturned: (equipmentName: string) => {
    NotificationService.info({
      title: 'Equipment Returned',
      message: `${equipmentName} has been successfully returned.`,
      actionUrl: '/modules/equipment-management',
    });
  },

  equipmentMaintenance: (equipmentName: string) => {
    NotificationService.warning({
      title: 'Equipment Maintenance',
      message: `${equipmentName} requires maintenance and has been temporarily unavailable.`,
      actionUrl: '/modules/equipment-management',
    });
  },

  // Payroll notifications
  payrollGenerated: (month: string) => {
    NotificationService.success({
      title: 'Payroll Generated',
      message: `Payroll for ${month} has been generated successfully.`,
      actionUrl: '/modules/payroll-management',
    });
  },

  advanceApproved: (amount: number) => {
    NotificationService.success({
      title: 'Advance Approved',
      message: `Your advance request for ${amount} has been approved.`,
      actionUrl: '/modules/payroll-management',
    });
  },

  advanceRejected: (reason?: string) => {
    NotificationService.error({
      title: 'Advance Rejected',
      message: reason || 'Your advance request has been rejected.',
      actionUrl: '/modules/payroll-management',
    });
  },

  // System notifications
  systemMaintenance: (message: string) => {
    NotificationService.warning({
      title: 'System Maintenance',
      message,
      duration: 10000,
    });
  },

  systemError: (message: string) => {
    NotificationService.error({
      title: 'System Error',
      message,
      duration: 8000,
    });
  },

  // Generic notifications
  success: (title: string, message: string, actionUrl?: string) => {
    NotificationService.success({ title, message, actionUrl });
  },

  error: (title: string, message: string, actionUrl?: string) => {
    NotificationService.error({ title, message, actionUrl });
  },

  warning: (title: string, message: string, actionUrl?: string) => {
    NotificationService.warning({ title, message, actionUrl });
  },

  info: (title: string, message: string, actionUrl?: string) => {
    NotificationService.info({ title, message, actionUrl });
  },

  // Approval notifications
  approvalRequired: (itemType: string, itemName: string, requesterName: string) => {
    toast.info(`Approval Required: ${itemType} "${itemName}" from ${requesterName}`, {
      description: 'Click to review and approve/reject',
      action: {
        label: 'Review',
        onClick: () => window.open('/super-admin-approvals', '_blank'),
      },
    });
  },

  timesheetApproval: (employeeName: string, week: string) => {
    toast.info(`Timesheet Approval Required`, {
      description: `${employeeName}'s timesheet for ${week} needs your approval`,
      action: {
        label: 'Review',
        onClick: () => window.open('/modules/timesheet-management', '_blank'),
      },
    });
  },

  leaveApproval: (employeeName: string, leaveType: string, startDate: string) => {
    toast.info(`Leave Request Approval`, {
      description: `${employeeName} requested ${leaveType} leave starting ${startDate}`,
      action: {
        label: 'Review',
        onClick: () => window.open('/modules/leave-management', '_blank'),
      },
    });
  },

  advanceApproval: (employeeName: string, amount: number, reason: string) => {
    toast.info(`Advance Request Approval`, {
      description: `${employeeName} requested $${amount} advance for ${reason}`,
      action: {
        label: 'Review',
        onClick: () => window.open('/modules/payroll-management', '_blank'),
      },
    });
  },

  equipmentApproval: (employeeName: string, equipmentType: string) => {
    toast.info(`Equipment Request Approval`, {
      description: `${employeeName} requested ${equipmentType}`,
      action: {
        label: 'Review',
        onClick: () => window.open('/modules/equipment-management', '_blank'),
      },
    });
  },

  // Approval status updates
  approvalGranted: (itemType: string, itemName: string) => {
    toast.success(`Approval Granted`, {
      description: `Your ${itemType} "${itemName}" has been approved!`,
    });
  },

  approvalRejected: (itemType: string, itemName: string, reason?: string) => {
    toast.error(`Approval Rejected`, {
      description: reason
        ? `Your ${itemType} "${itemName}" was rejected: ${reason}`
        : `Your ${itemType} "${itemName}" was rejected`,
    });
  },

  // Manager/Admin specific approval notifications
  newApprovalRequest: (itemType: string, count: number) => {
    if (count === 1) {
      toast.info(`New Approval Request`, {
        description: `You have 1 new ${itemType} request waiting for approval`,
        action: {
          label: 'Review',
          onClick: () => window.open('/super-admin-approvals', '_blank'),
        },
      });
    } else {
      toast.info(`New Approval Requests`, {
        description: `You have ${count} new ${itemType} requests waiting for approval`,
        action: {
          label: 'Review All',
          onClick: () => window.open('/super-admin-approvals', '_blank'),
        },
      });
    }
  },

  // Bulk approval notifications
  bulkApprovalRequired: (itemType: string, count: number) => {
    toast.warning(`Bulk Approval Required`, {
      description: `${count} ${itemType} items need your approval`,
      action: {
        label: 'Review All',
        onClick: () => window.open('/super-admin-approvals', '_blank'),
      },
    });
  },
};
