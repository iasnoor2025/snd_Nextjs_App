import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { hasPermission, User } from './server-rbac';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import' | 'sync' | 'reset';
export type Subject = string;

export interface PermissionConfig {
  action: Action;
  subject: Subject;
  fallbackAction?: Action;
  fallbackSubject?: Subject;
}

// Define the handler function type
type ApiHandler = (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>;

/**
 * Permission configurations for different subjects
 * This provides a centralized way to define permissions for API routes
 */
export const PermissionConfigs = {
  user: {
    read: { action: 'read' as Action, subject: 'User' },
    create: { action: 'create' as Action, subject: 'User' },
    update: { action: 'update' as Action, subject: 'User' },
    delete: { action: 'delete' as Action, subject: 'User' },
    manage: { action: 'manage' as Action, subject: 'User' },
  },
  employee: {
    read: { action: 'read' as Action, subject: 'Employee' },
    create: { action: 'create' as Action, subject: 'Employee' },
    update: { action: 'update' as Action, subject: 'Employee' },
    delete: { action: 'delete' as Action, subject: 'Employee' },
    manage: { action: 'manage' as Action, subject: 'Employee' },
  },
  customer: {
    read: { action: 'read' as Action, subject: 'Customer' },
    create: { action: 'create' as Action, subject: 'Customer' },
    update: { action: 'update' as Action, subject: 'Customer' },
    delete: { action: 'delete' as Action, subject: 'Customer' },
    manage: { action: 'manage' as Action, subject: 'Customer' },
  },
  equipment: {
    read: { action: 'read' as Action, subject: 'Equipment' },
    create: { action: 'create' as Action, subject: 'Equipment' },
    update: { action: 'update' as Action, subject: 'Equipment' },
    delete: { action: 'delete' as Action, subject: 'Equipment' },
    manage: { action: 'manage' as Action, subject: 'Equipment' },
    sync: { action: 'sync' as Action, subject: 'Equipment' },
  },
  project: {
    read: { action: 'read' as Action, subject: 'Project' },
    create: { action: 'create' as Action, subject: 'Project' },
    update: { action: 'update' as Action, subject: 'Project' },
    delete: { action: 'delete' as Action, subject: 'Project' },
    manage: { action: 'manage' as Action, subject: 'Project' },
  },
  rental: {
    read: { action: 'read' as Action, subject: 'Rental' },
    create: { action: 'create' as Action, subject: 'Rental' },
    update: { action: 'update' as Action, subject: 'Rental' },
    delete: { action: 'delete' as Action, subject: 'Rental' },
    manage: { action: 'manage' as Action, subject: 'Rental' },
  },
  quotation: {
    read: { action: 'read' as Action, subject: 'Quotation' },
    create: { action: 'create' as Action, subject: 'Quotation' },
    update: { action: 'update' as Action, subject: 'Quotation' },
    delete: { action: 'delete' as Action, subject: 'Quotation' },
    manage: { action: 'manage' as Action, subject: 'Quotation' },
  },
  payroll: {
    read: { action: 'read' as Action, subject: 'Payroll' },
    create: { action: 'create' as Action, subject: 'Payroll' },
    update: { action: 'update' as Action, subject: 'Payroll' },
    delete: { action: 'delete' as Action, subject: 'Payroll' },
    manage: { action: 'manage' as Action, subject: 'Payroll' },
  },
  timesheet: {
    read: { action: 'read' as Action, subject: 'Timesheet' },
    create: { action: 'create' as Action, subject: 'Timesheet' },
    update: { action: 'update' as Action, subject: 'Timesheet' },
    delete: { action: 'delete' as Action, subject: 'Timesheet' },
    manage: { action: 'manage' as Action, subject: 'Timesheet' },
    approve: { action: 'approve' as Action, subject: 'Timesheet' },
    reject: { action: 'reject' as Action, subject: 'Timesheet' },
    // Stage-specific approval permissions
    'approve.foreman': { action: 'approve' as Action, subject: 'Timesheet.Foreman' },
    'approve.incharge': { action: 'approve' as Action, subject: 'Timesheet.Incharge' },
    'approve.checking': { action: 'approve' as Action, subject: 'Timesheet.Checking' },
    'approve.manager': { action: 'approve' as Action, subject: 'Timesheet.Manager' },
  },
  leave: {
    read: { action: 'read' as Action, subject: 'Leave' },
    create: { action: 'create' as Action, subject: 'Leave' },
    update: { action: 'update' as Action, subject: 'Leave' },
    delete: { action: 'delete' as Action, subject: 'Leave' },
    manage: { action: 'manage' as Action, subject: 'Leave' },
    approve: { action: 'approve' as Action, subject: 'Leave' },
    reject: { action: 'reject' as Action, subject: 'Leave' },
  },
  department: {
    read: { action: 'read' as Action, subject: 'Department' },
    create: { action: 'create' as Action, subject: 'Department' },
    update: { action: 'update' as Action, subject: 'Department' },
    delete: { action: 'delete' as Action, subject: 'Department' },
    manage: { action: 'manage' as Action, subject: 'Department' },
  },
  designation: {
    read: { action: 'read' as Action, subject: 'Designation' },
    create: { action: 'create' as Action, subject: 'Designation' },
    update: { action: 'update' as Action, subject: 'Designation' },
    delete: { action: 'delete' as Action, subject: 'Designation' },
    manage: { action: 'manage' as Action, subject: 'Designation' },
  },
  company: {
    read: { action: 'read' as Action, subject: 'Company' },
    create: { action: 'create' as Action, subject: 'Company' },
    update: { action: 'update' as Action, subject: 'Company' },
    delete: { action: 'delete' as Action, subject: 'Company' },
    manage: { action: 'manage' as Action, subject: 'Company' },
  },
  settings: {
    read: { action: 'read' as Action, subject: 'Settings' },
    create: { action: 'create' as Action, subject: 'Settings' },
    update: { action: 'update' as Action, subject: 'Settings' },
    delete: { action: 'delete' as Action, subject: 'Settings' },
    manage: { action: 'manage' as Action, subject: 'Settings' },
  },
  location: {
    read: { action: 'read' as Action, subject: 'Location' },
    create: { action: 'create' as Action, subject: 'Location' },
    update: { action: 'update' as Action, subject: 'Location' },
    delete: { action: 'delete' as Action, subject: 'Location' },
    manage: { action: 'manage' as Action, subject: 'Location' },
  },
  maintenance: {
    read: { action: 'read' as Action, subject: 'Maintenance' },
    create: { action: 'create' as Action, subject: 'Maintenance' },
    update: { action: 'update' as Action, subject: 'Maintenance' },
    delete: { action: 'delete' as Action, subject: 'Maintenance' },
    manage: { action: 'manage' as Action, subject: 'Maintenance' },
  },
  safety: {
    read: { action: 'read' as Action, subject: 'Safety' },
    create: { action: 'create' as Action, subject: 'Safety' },
    update: { action: 'update' as Action, subject: 'Safety' },
    delete: { action: 'delete' as Action, subject: 'Safety' },
    manage: { action: 'manage' as Action, subject: 'Safety' },
  },
  salaryIncrement: {
    read: { action: 'read' as Action, subject: 'SalaryIncrement' },
    create: { action: 'create' as Action, subject: 'SalaryIncrement' },
    update: { action: 'update' as Action, subject: 'SalaryIncrement' },
    delete: { action: 'delete' as Action, subject: 'SalaryIncrement' },
    manage: { action: 'manage' as Action, subject: 'SalaryIncrement' },
    approve: { action: 'approve' as Action, subject: 'SalaryIncrement' },
    reject: { action: 'reject' as Action, subject: 'SalaryIncrement' },
    apply: { action: 'apply' as Action, subject: 'SalaryIncrement' },
  },
  advance: {
    read: { action: 'read' as Action, subject: 'Advance' },
    create: { action: 'create' as Action, subject: 'Advance' },
    update: { action: 'update' as Action, subject: 'Advance' },
    delete: { action: 'delete' as Action, subject: 'Advance' },
    manage: { action: 'manage' as Action, subject: 'Advance' },
  },
  iqama: {
    read: { action: 'read' as Action, subject: 'Iqama' },
    create: { action: 'create' as Action, subject: 'Iqama' },
    update: { action: 'update' as Action, subject: 'Iqama' },
    delete: { action: 'delete' as Action, subject: 'Iqama' },
    manage: { action: 'manage' as Action, subject: 'Iqama' },
    approve: { action: 'approve' as Action, subject: 'Iqama' },
    reject: { action: 'reject' as Action, subject: 'Iqama' },
    renew: { action: 'renew' as Action, subject: 'Iqama' },
    expire: { action: 'expire' as Action, subject: 'Iqama' },
  },
  assignment: {
    read: { action: 'read' as Action, subject: 'Assignment' },
    create: { action: 'create' as Action, subject: 'Assignment' },
    update: { action: 'update' as Action, subject: 'Assignment' },
    delete: { action: 'delete' as Action, subject: 'Assignment' },
    manage: { action: 'manage' as Action, subject: 'Assignment' },
  },
  report: {
    read: { action: 'read' as Action, subject: 'Report' },
    create: { action: 'create' as Action, subject: 'Report' },
    update: { action: 'update' as Action, subject: 'Report' },
    delete: { action: 'delete' as Action, subject: 'Report' },
    manage: { action: 'manage' as Action, subject: 'Report' },
    export: { action: 'export' as Action, subject: 'Report' },
  },
  // Employee Document permissions (for employees to manage their own documents)
  'employee-document': {
    read: { action: 'read' as Action, subject: 'employee-document' },
    create: { action: 'create' as Action, subject: 'employee-document' },
    update: { action: 'update' as Action, subject: 'employee-document' },
    delete: { action: 'delete' as Action, subject: 'employee-document' },
    manage: { action: 'manage' as Action, subject: 'employee-document' },
  },
  // Equipment Document permissions (for equipment document management)
  'equipment-document': {
    read: { action: 'read' as Action, subject: 'equipment-document' },
    create: { action: 'create' as Action, subject: 'equipment-document' },
    update: { action: 'update' as Action, subject: 'equipment-document' },
    delete: { action: 'delete' as Action, subject: 'equipment-document' },
    manage: { action: 'manage' as Action, subject: 'equipment-document' },
  },
  // Document Management permissions
  document: {
    read: { action: 'read' as Action, subject: 'Document' },
    create: { action: 'create' as Action, subject: 'Document' },
    update: { action: 'update' as Action, subject: 'Document' },
    delete: { action: 'delete' as Action, subject: 'Document' },
    manage: { action: 'manage' as Action, subject: 'Document' },
    upload: { action: 'upload' as Action, subject: 'Document' },
    download: { action: 'download' as Action, subject: 'Document' },
  },
  dashboard: {
    read: { action: 'read' as Action, subject: 'Dashboard' },
    create: { action: 'create' as Action, subject: 'Dashboard' },
    update: { action: 'update' as Action, subject: 'Dashboard' },
    delete: { action: 'delete' as Action, subject: 'Dashboard' },
    manage: { action: 'manage' as Action, subject: 'Dashboard' },
  },
  'own-profile': {
    read: { action: 'read' as Action, subject: 'own-profile' },
    update: { action: 'update' as Action, subject: 'own-profile' },
    manage: { action: 'manage' as Action, subject: 'own-profile' },
  },
  admin: {
    read: { action: 'read' as Action, subject: 'Admin' },
    create: { action: 'create' as Action, subject: 'Admin' },
    update: { action: 'update' as Action, subject: 'Admin' },
    delete: { action: 'delete' as Action, subject: 'Admin' },
    manage: { action: 'manage' as Action, subject: 'Admin' },
  },
};

/**
 * Middleware function to check permissions for API routes
 * This uses database-driven permission checks instead of hardcoded ones
 */
export async function checkApiPermission(
  _request: NextRequest,
  config: PermissionConfig
): Promise<{ authorized: boolean; user?: User; error?: string }> {
  try {
    console.log('🔐 API Permission Check - Starting...');
    console.log('🔐 Config:', config);
    
    // Get server session
    const session = await getServerSession(authConfig);
    console.log('🔐 Session:', session);
    
    if (!session?.user) {
      console.error('API permission check failed: No session or user');
      return {
        authorized: false,
        error: 'Authentication required'
      };
    }

    // Create user object for permission checking
    const user: User = {
      id: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || '',
      role: (session.user.role as string) || 'USER',
      isActive: session.user.isActive !== false,
    };
    
    console.log('🔐 User object created:', user);
    console.log('🔐 Checking permission:', `${config.action}.${config.subject}`);

    // Check primary permission
    let hasAccess = await hasPermission(user, config.action, config.subject);
    console.log('🔐 Primary permission result:', hasAccess);
    
    // If primary permission fails, try fallback
    if (!hasAccess && config.fallbackAction && config.fallbackSubject) {
      console.log('🔐 Trying fallback permission:', `${config.fallbackAction}.${config.fallbackSubject}`);
      hasAccess = await hasPermission(user, config.fallbackAction, config.fallbackSubject);
      console.log('🔐 Fallback permission result:', hasAccess);
    }

    if (!hasAccess) {
      console.error(`API permission check failed: User ${user.id} lacks ${config.action}.${config.subject} permission`);
      return {
        authorized: false,
        user,
        error: `Insufficient permissions: ${config.action}.${config.subject}`
      };
    }

    console.log('🔐 Permission check SUCCESS - User authorized');
    return {
      authorized: true,
      user
    };

  } catch (error) {
    console.error('API permission check error:', error);
    return {
      authorized: false,
      error: 'Permission check failed'
    };
  }
}

/**
 * Higher-order function to wrap API route handlers with permission checks
 */
export function withPermission(config: PermissionConfig) {
  return function(handler: ApiHandler) {
    return async function(request: NextRequest, ...args: unknown[]): Promise<NextResponse> {
      try {
        const permissionResult = await checkApiPermission(request, config);
        
        if (!permissionResult.authorized) {
          return NextResponse.json(
            { 
              error: permissionResult.error || 'Access denied',
              code: 'INSUFFICIENT_PERMISSIONS'
            },
            { status: 403 }
          );
        }

        // Call the original handler with the request and additional args
        return handler(request, ...args);
      } catch (error) {
        console.error('Permission middleware error:', error);
        return NextResponse.json(
          { 
            error: 'Permission check failed',
            code: 'PERMISSION_ERROR'
          },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Simple read permission wrapper for API routes
 */
export function withReadPermission(subject: Subject) {
  return withPermission({ action: 'read', subject });
}



/**
 * Simple permission check for API routes
 */
export async function requirePermission(
  request: NextRequest,
  action: Action,
  subject: Subject
): Promise<User> {
  const permissionResult = await checkApiPermission(request, { action, subject });
  
  if (!permissionResult.authorized) {
    throw new Error(permissionResult.error || 'Access denied');
  }

  return permissionResult.user!;
}

/**
 * Check if user has any of the required roles
 */
export function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  const roleHierarchy: Record<string, number> = {
    'SUPER_ADMIN': 1,
    'ADMIN': 2,
    'MANAGER': 3,
    'SUPERVISOR': 4,
    'OPERATOR': 5,
    'EMPLOYEE': 6,
    'USER': 7,
  };

  const userRoleLevel = roleHierarchy[userRole] || 10; 

  return requiredRoles.some(requiredRole => {
    const requiredRoleLevel = roleHierarchy[requiredRole] || 10;
    return userRoleLevel <= requiredRoleLevel; // Lower number = higher priority
  });
}

/**
 * Role-based access control for API routes
 */
export function withRole(requiredRoles: string[]) {
  return function(handler: ApiHandler) {
    return async function(request: NextRequest, ...args: unknown[]): Promise<NextResponse> {
      try {
        const session = await getServerSession(authConfig);
        
        if (!session?.user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        const userRole = (session.user.role as string) || 'USER';
        
        if (!hasRequiredRole(userRole, requiredRoles)) {
          return NextResponse.json(
            { 
              error: 'Insufficient role permissions',
              code: 'INSUFFICIENT_ROLE'
            },
            { status: 403 }
          );
        }

        // Call the original handler
        return handler(request, ...args);
      } catch (error) {
        console.error('Role-based access control error:', error);
        return NextResponse.json(
          { error: 'Access control failed' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Simple authentication wrapper for API routes
 * This is the legacy withAuth function that many routes are using
 */
export function withAuth(handler: ApiHandler) {
  return async function(request: NextRequest, ...args: unknown[]): Promise<NextResponse> {
    try {
      const session = await getServerSession(authConfig);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Call the original handler
      return handler(request, ...args);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Employee list permission wrapper for API routes
 * This provides special access control for employee-related routes
 * where employees can only access their own data
 */
export function withEmployeeListPermission(handler: ApiHandler) {
  return async function(request: NextRequest, ...args: unknown[]): Promise<NextResponse> {
    try {
      const session = await getServerSession(authConfig);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check if user has permission to access employee data
      const hasEmployeePermission = await hasPermission(
        { 
          id: session.user.id || '0', 
          email: session.user.email || '', 
          name: session.user.name || '', 
          role: session.user.role || 'USER', 
          isActive: true 
        },
        'read',
        'Employee'
      );

      if (!hasEmployeePermission) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions to access employee data',
            code: 'INSUFFICIENT_PERMISSIONS'
          },
          { status: 403 }
        );
      }

      // Call the original handler
      return handler(request, ...args);
    } catch (error) {
      console.error('Employee list permission error:', error);
      return NextResponse.json(
        { error: 'Permission check failed' },
        { status: 500 }
      );
    }
  };
}
