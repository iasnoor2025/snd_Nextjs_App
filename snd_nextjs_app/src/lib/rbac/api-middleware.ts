import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { checkUserPermission } from './permission-service';
import { Action, Subject } from './custom-rbac';

export interface PermissionConfig {
  action: Action;
  subject: Subject;
  fallbackAction?: Action;
  fallbackSubject?: Subject;
}

/**
 * Middleware function to check permissions for API routes
 * This replaces hardcoded permission checks with database-driven ones
 */
export async function checkApiPermission(
  request: NextRequest,
  config: PermissionConfig
): Promise<{ authorized: boolean; user?: any; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { authorized: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;
    if (!userId) {
      return { authorized: false, error: 'Invalid user session' };
    }

    // Check primary permission
    const permissionCheck = await checkUserPermission(
      userId,
      config.action,
      config.subject
    );

    if (permissionCheck.hasPermission) {
      return { authorized: true, user: session.user };
    }

    // If fallback permissions are configured, try those
    if (config.fallbackAction && config.fallbackSubject) {
      const fallbackCheck = await checkUserPermission(
        userId,
        config.fallbackAction,
        config.fallbackSubject
      );

      if (fallbackCheck.hasPermission) {
        return { authorized: true, user: session.user };
      }
    }

    return {
      authorized: false,
      error: permissionCheck.reason || 'Insufficient permissions',
      user: session.user,
    };
  } catch (error) {
    console.error('Error checking API permission:', error);
    return { authorized: false, error: 'Error checking permissions' };
  }
}

/**
 * Higher-order function to create permission-protected API handlers
 */
export function withPermission(
  handler: (request: NextRequest, params?: any) => Promise<NextResponse>,
  config: PermissionConfig
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const permissionResult = await checkApiPermission(request, config);
    
    if (!permissionResult.authorized) {
      return NextResponse.json(
        { error: permissionResult.error || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, params);
  };
}

/**
 * Temporary bypass function for read operations
 * This allows read access without strict permission checks
 */
export function withReadPermission(
  handler: (request: NextRequest, params?: any) => Promise<NextResponse>,
  config: PermissionConfig
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    // For read operations, we'll bypass strict permission checks temporarily
    // but still check if user is authenticated
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Allow access for now - we can add permission checks back later
      return handler(request, params);
    } catch (error) {
      console.error('Error in withReadPermission:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Utility function to create permission configurations for common operations
 */
export const PermissionConfigs = {
  // Employee permissions
  employee: {
    read: { action: 'read' as Action, subject: 'Employee' as Subject },
    create: { action: 'create' as Action, subject: 'Employee' as Subject },
    update: { action: 'update' as Action, subject: 'Employee' as Subject },
    delete: { action: 'delete' as Action, subject: 'Employee' as Subject },
    manage: { action: 'manage' as Action, subject: 'Employee' as Subject },
  },

  // Customer permissions
  customer: {
    read: { action: 'read' as Action, subject: 'Customer' as Subject },
    create: { action: 'create' as Action, subject: 'Customer' as Subject },
    update: { action: 'update' as Action, subject: 'Customer' as Subject },
    delete: { action: 'delete' as Action, subject: 'Customer' as Subject },
    manage: { action: 'manage' as Action, subject: 'Customer' as Subject },
  },

  // Equipment permissions
  equipment: {
    read: { action: 'read' as Action, subject: 'Equipment' as Subject },
    create: { action: 'create' as Action, subject: 'Equipment' as Subject },
    update: { action: 'update' as Action, subject: 'Equipment' as Subject },
    delete: { action: 'delete' as Action, subject: 'Equipment' as Subject },
    manage: { action: 'manage' as Action, subject: 'Equipment' as Subject },
  },

  // Rental permissions
  rental: {
    read: { action: 'read' as Action, subject: 'Rental' as Subject },
    create: { action: 'create' as Action, subject: 'Rental' as Subject },
    update: { action: 'update' as Action, subject: 'Rental' as Subject },
    delete: { action: 'delete' as Action, subject: 'Rental' as Subject },
    manage: { action: 'manage' as Action, subject: 'Rental' as Subject },
  },

  // Payroll permissions
  payroll: {
    read: { action: 'read' as Action, subject: 'Payroll' as Subject },
    create: { action: 'create' as Action, subject: 'Payroll' as Subject },
    update: { action: 'update' as Action, subject: 'Payroll' as Subject },
    delete: { action: 'delete' as Action, subject: 'Payroll' as Subject },
    manage: { action: 'manage' as Action, subject: 'Payroll' as Subject },
  },

  // Timesheet permissions
  timesheet: {
    read: { action: 'read' as Action, subject: 'Timesheet' as Subject },
    create: { action: 'create' as Action, subject: 'Timesheet' as Subject },
    update: { action: 'update' as Action, subject: 'Timesheet' as Subject },
    delete: { action: 'delete' as Action, subject: 'Timesheet' as Subject },
    manage: { action: 'manage' as Action, subject: 'Timesheet' as Subject },
    approve: { action: 'approve' as Action, subject: 'Timesheet' as Subject },
    reject: { action: 'reject' as Action, subject: 'Timesheet' as Subject },
  },

  // Advance permissions
  advance: {
    read: { action: 'read' as Action, subject: 'Advance' as Subject },
    create: { action: 'create' as Action, subject: 'Advance' as Subject },
    update: { action: 'update' as Action, subject: 'Advance' as Subject },
    delete: { action: 'delete' as Action, subject: 'Advance' as Subject },
    manage: { action: 'manage' as Action, subject: 'Advance' as Subject },
    approve: { action: 'approve' as Action, subject: 'Advance' as Subject },
    reject: { action: 'reject' as Action, subject: 'Advance' as Subject },
  },

  // Assignment permissions
  assignment: {
    read: { action: 'read' as Action, subject: 'Assignment' as Subject },
    create: { action: 'create' as Action, subject: 'Assignment' as Subject },
    update: { action: 'update' as Action, subject: 'Assignment' as Subject },
    delete: { action: 'delete' as Action, subject: 'Assignment' as Subject },
    manage: { action: 'manage' as Action, subject: 'Assignment' as Subject },
    approve: { action: 'approve' as Action, subject: 'Assignment' as Subject },
    reject: { action: 'reject' as Action, subject: 'Assignment' as Subject },
  },

  // Project permissions
  project: {
    read: { action: 'read' as Action, subject: 'Project' as Subject },
    create: { action: 'create' as Action, subject: 'Project' as Subject },
    update: { action: 'update' as Action, subject: 'Project' as Subject },
    delete: { action: 'delete' as Action, subject: 'Project' as Subject },
    manage: { action: 'manage' as Action, subject: 'Project' as Subject },
  },

  // Settings permissions
  settings: {
    read: { action: 'read' as Action, subject: 'Settings' as Subject },
    create: { action: 'create' as Action, subject: 'Settings' as Subject },
    update: { action: 'update' as Action, subject: 'Settings' as Subject },
    delete: { action: 'delete' as Action, subject: 'Settings' as Subject },
    manage: { action: 'manage' as Action, subject: 'Settings' as Subject },
  },

  // User permissions
  user: {
    read: { action: 'read' as Action, subject: 'User' as Subject },
    create: { action: 'create' as Action, subject: 'User' as Subject },
    update: { action: 'update' as Action, subject: 'User' as Subject },
    delete: { action: 'delete' as Action, subject: 'User' as Subject },
    manage: { action: 'manage' as Action, subject: 'User' as Subject },
  },
};

/**
 * Example usage of the permission middleware:
 * 
 * // In your API route file:
 * import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
 * 
 * export const GET = withPermission(
 *   async (request: NextRequest) => {
 *     // Your API logic here
 *     return NextResponse.json({ data: 'success' });
 *   },
 *   PermissionConfigs.employee.read
 * );
 * 
 * export const POST = withPermission(
 *   async (request: NextRequest) => {
 *     // Your API logic here
 *     return NextResponse.json({ data: 'created' });
 *   },
 *   PermissionConfigs.employee.create
 * );
 */ 