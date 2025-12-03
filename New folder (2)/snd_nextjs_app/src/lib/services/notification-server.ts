/**
 * Notification Server Service
 * This file is used in API routes, not as a server action.
 * Do not add 'use server' directive to this file.
 */

import { getDb } from '@/lib/drizzle';
import { notifications, users } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export interface ApprovalNotificationData {
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
}

export class NotificationServerService {
  // Create approval notification in database
  static async createApprovalNotification(data: ApprovalNotificationData) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Try to get userId from email
      let userId: number | null = null;
      try {
        const userResult = await db.select({ id: users.id }).from(users).where(eq(users.email, data.userEmail)).limit(1);
        if (userResult.length > 0) {
          userId = userResult[0].id;
        }
      } catch (error) {
        // If user lookup fails, continue without userId
        console.warn('Could not find user by email for notification:', data.userEmail);
      }

      const result = await db
        .insert(notifications)
        .values({
          userId: userId,
          type: 'info',
          title: data.title,
          message: data.message,
          data: data.data || {},
          actionUrl: data.actionUrl,
          priority: data.priority || 'medium',
          userEmail: data.userEmail,
          read: false,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .returning();

      if (result.length === 0) {
        throw new Error('Failed to create notification');
      }

      return {
        id: String(result[0].id),
        type: result[0].type as 'info' | 'success' | 'warning' | 'error',
        title: result[0].title,
        message: result[0].message,
        data: result[0].data || {},
        actionUrl: result[0].actionUrl || undefined,
        priority: result[0].priority as 'low' | 'medium' | 'high',
        userEmail: result[0].userEmail,
        timestamp: new Date(result[0].createdAt),
        read: result[0].read,
      };
    } catch (error) {
      console.error('Error creating approval notification:', error);
      throw error;
    }
  }

  // Create chat message notification
  static async createChatNotification(
    recipientEmail: string,
    senderName: string,
    messageContent: string,
    conversationId: number,
    messageId: number
  ) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Try to get userId from email
      let userId: number | null = null;
      try {
        const userResult = await db.select({ id: users.id }).from(users).where(eq(users.email, recipientEmail)).limit(1);
        if (userResult.length > 0) {
          userId = userResult[0].id;
        }
      } catch (error) {
        console.warn('Could not find user by email for notification:', recipientEmail);
      }

      // Truncate message content for notification title
      const truncatedContent = messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent;

      const result = await db
        .insert(notifications)
        .values({
          userId: userId,
          type: 'info',
          title: `New message from ${senderName}`,
          message: truncatedContent,
          data: {
            type: 'chat',
            conversationId,
            messageId,
            senderName,
          },
          actionUrl: `/en/chat?conversation=${conversationId}`,
          priority: 'medium',
          userEmail: recipientEmail,
          read: false,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .returning();

      if (result.length === 0) {
        throw new Error('Failed to create chat notification');
      }

      return {
        id: String(result[0].id),
        type: result[0].type as 'info' | 'success' | 'warning' | 'error',
        title: result[0].title,
        message: result[0].message,
        data: result[0].data || {},
        actionUrl: result[0].actionUrl || undefined,
        priority: result[0].priority as 'low' | 'medium' | 'high',
        userEmail: result[0].userEmail,
        timestamp: new Date(result[0].createdAt),
        read: result[0].read,
      };
    } catch (error) {
      console.error('Error creating chat notification:', error);
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

