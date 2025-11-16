// Re-export client-side notification service for backward compatibility
export { NotificationService, notify, type NotificationOptions } from './notification-client';

// Re-export server-side notification service
export { NotificationServerService, type ApprovalNotificationData } from './notification-server';
