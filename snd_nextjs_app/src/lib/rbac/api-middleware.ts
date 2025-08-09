import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { checkUserPermission } from './permission-service';
import { Action, Subject } from './custom-rbac';
import { db, initializePrisma } from '@/lib/db';
import { users, modelHasRoles, roles, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

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
    const session = await getServerSession(authConfig);
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
 * Middleware function to check employee-specific permissions
 * Employee users can only view employee data if their national_id matches the employee's iqama_number
 */
export async function checkEmployeeAccess(
  request: NextRequest,
  employeeId: number
): Promise<{ authorized: boolean; user?: any; error?: string }> {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return { authorized: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;
    if (!userId) {
      return { authorized: false, error: 'Invalid user session' };
    }

    // Get user with role information via Drizzle
    const userRows = await db
      .select({
        id: users.id,
        national_id: users.nationalId,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(modelHasRoles, eq(modelHasRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, modelHasRoles.roleId))
      .where(eq(users.id, parseInt(userId)));
    const user = userRows.length
      ? {
          id: userRows[0].id,
          national_id: userRows[0].national_id,
          user_roles: userRows.filter(r => r.roleName).map(r => ({ role: { name: r.roleName! } })),
        }
      : null;

    if (!user) {
      return { authorized: false, error: 'User not found' };
    }

    // Get user's role
    const userRole = user.user_roles[0]?.role;
    if (!userRole) {
      return { authorized: false, error: 'User has no assigned role' };
    }

    console.log('🔍 User role:', userRole.name);
    console.log('🔍 User role comparison:', { 
      isEmployee: userRole.name === 'employee',
      isEmployeeLower: userRole.name === 'employee'.toLowerCase(),
      roleName: userRole.name 
    });

    // If user is admin or has manage permissions, allow access
    if (userRole.name === 'admin' || userRole.name === 'super_admin') {
      return { authorized: true, user: session.user };
    }

    // Check if user has manage.employee permission
    const hasManagePermission = await checkUserPermission(
      userId,
      'manage' as Action,
      'Employee' as Subject
    );

    if (hasManagePermission.hasPermission) {
      return { authorized: true, user: session.user };
    }

    // For employee role users, check if their national_id matches the employee's iqama_number
    if (userRole.name === 'employee') {
      // Get the employee data being requested using safe operation
      const employeeRows = await db
        .select({ iqama_number: employees.iqamaNumber })
        .from(employees)
        .where(eq(employees.id, employeeId));
      const employee = employeeRows[0];

      if (!employee) {
        return { authorized: false, error: 'Employee not found' };
      }

      // Check if user's national_id matches employee's iqama_number
      if (user.national_id && employee.iqama_number && user.national_id === employee.iqama_number) {
        return { authorized: true, user: session.user };
      } else {
        return { 
          authorized: false, 
          error: 'Access denied: Your national ID does not match this employee record',
          user: session.user 
        };
      }
    }

    // For other roles, check standard permissions
    const permissionCheck = await checkUserPermission(
      userId,
      'read' as Action,
      'Employee' as Subject
    );

    if (permissionCheck.hasPermission) {
      return { authorized: true, user: session.user };
    }

    return {
      authorized: false,
      error: permissionCheck.reason || 'Insufficient permissions',
      user: session.user,
    };
  } catch (error) {
    console.error('Error checking employee access:', error);
    return { authorized: false, error: 'Error checking permissions' };
  }
}

/**
 * Comprehensive middleware function to ensure employee users can only access their own data
 * This function should be used for all employee-related API routes
 */
export async function checkEmployeeOwnDataAccess(
  request: NextRequest,
  employeeId?: number
): Promise<{ authorized: boolean; user?: any; error?: string; ownEmployeeId?: number }> {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return { authorized: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;
    if (!userId) {
      return { authorized: false, error: 'Invalid user session' };
    }

    // Get user with role information via Drizzle
    const userRows = await db
      .select({
        id: users.id,
        national_id: users.nationalId,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(modelHasRoles, eq(modelHasRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, modelHasRoles.roleId))
      .where(eq(users.id, parseInt(userId)));
    const user = userRows.length
      ? {
          id: userRows[0].id,
          national_id: userRows[0].national_id,
          user_roles: userRows.filter(r => r.roleName).map(r => ({ role: { name: r.roleName! } })),
        }
      : null;

    if (!user) {
      return { authorized: false, error: 'User not found' };
    }

    // Get user's role
    const userRole = user.user_roles[0]?.role;
    if (!userRole) {
      return { authorized: false, error: 'User has no assigned role' };
    }

    // If user is admin or super_admin, allow full access
    if (userRole.name === 'admin' || userRole.name === 'super_admin') {
      return { authorized: true, user: session.user };
    }

    // Check if user has manage.employee permission (full access)
    const hasManagePermission = await checkUserPermission(
      userId,
      'manage' as Action,
      'Employee' as Subject
    );

    if (hasManagePermission.hasPermission) {
      return { authorized: true, user: session.user };
    }

    // For employee role users, they can only access their own data
    if (userRole.name === 'employee') {
      // Find the employee record that matches this user's national_id using safe operation
      const ownRows = await db
        .select({ id: employees.id, iqama_number: employees.iqamaNumber })
        .from(employees)
        .where(eq(employees.iqamaNumber, user.national_id ?? ''));
      const ownEmployee = ownRows[0];

      if (!ownEmployee) {
        return { 
          authorized: false, 
          error: 'No employee record found for your national ID',
          user: session.user 
        };
      }

      // If a specific employee ID is provided, check if it matches the user's own employee record
      if (employeeId) {
        if (employeeId !== ownEmployee.id) {
          return { 
            authorized: false, 
            error: 'Access denied: You can only access your own employee data',
            user: session.user 
          };
        }
      }

      // Return the user's own employee ID for filtering purposes
      return { 
        authorized: true, 
        user: session.user, 
        ownEmployeeId: ownEmployee.id 
      };
    }

    // For other roles, check standard read permissions
    const hasReadPermission = await checkUserPermission(
      userId,
      'read' as Action,
      'Employee' as Subject
    );

    if (hasReadPermission.hasPermission) {
      return { authorized: true, user: session.user };
    }

    // For employee role users, allow access to their own data even without explicit read permission
    if (userRole.name === 'employee') {
      // Find the employee record that matches this user's national_id using safe operation
      const ownRows2 = await db
        .select({ id: employees.id, iqama_number: employees.iqamaNumber })
        .from(employees)
        .where(eq(employees.iqamaNumber, user.national_id ?? ''));
      const ownEmployee = ownRows2[0];

      if (!ownEmployee) {
        return { 
          authorized: false, 
          error: 'No employee record found for your national ID',
          user: session.user 
        };
      }

      // Return the user's own employee ID for filtering purposes
      return { 
        authorized: true, 
        user: session.user, 
        ownEmployeeId: ownEmployee.id 
      };
    }

    return {
      authorized: false,
      error: hasReadPermission.reason || 'Insufficient permissions',
      user: session.user,
    };
  } catch (error) {
    console.error('Error checking employee own data access:', error);
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
 * Higher-order function to create employee-specific permission-protected API handlers
 */
export function withEmployeePermission(
  handler: (request: NextRequest, params?: any) => Promise<NextResponse>,
  employeeIdExtractor: (params: any) => number
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const employeeId = employeeIdExtractor(params);
    const permissionResult = await checkEmployeeAccess(request, employeeId);
    
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
 * Higher-order function for employee list routes that filters data for employee users
 */
export function withEmployeeListPermission(
  handler: (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }, params?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const accessResult = await checkEmployeeOwnDataAccess(request);
    
    if (!accessResult.authorized) {
      return NextResponse.json(
        { error: accessResult.error || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Add the ownEmployeeId to the request context for the handler to use
    const enhancedRequest = request as NextRequest & { 
      employeeAccess: { 
        ownEmployeeId?: number; 
        user: any 
      } 
    };
    enhancedRequest.employeeAccess = {
      ownEmployeeId: accessResult.ownEmployeeId,
      user: accessResult.user,
    };

    return handler(enhancedRequest, params);
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
      const session = await getServerSession(authConfig);
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

  // Maintenance permissions
  maintenance: {
    read: { action: 'read' as Action, subject: 'Maintenance' as Subject },
    create: { action: 'create' as Action, subject: 'Maintenance' as Subject },
    update: { action: 'update' as Action, subject: 'Maintenance' as Subject },
    delete: { action: 'delete' as Action, subject: 'Maintenance' as Subject },
    manage: { action: 'manage' as Action, subject: 'Maintenance' as Subject },
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

  // Company permissions
  company: {
    read: { action: 'read' as Action, subject: 'Company' as Subject },
    create: { action: 'create' as Action, subject: 'Company' as Subject },
    update: { action: 'update' as Action, subject: 'Company' as Subject },
    delete: { action: 'delete' as Action, subject: 'Company' as Subject },
    manage: { action: 'manage' as Action, subject: 'Company' as Subject },
  },

  // Department permissions
  department: {
    read: { action: 'read' as Action, subject: 'Department' as Subject },
    create: { action: 'create' as Action, subject: 'Department' as Subject },
    update: { action: 'update' as Action, subject: 'Department' as Subject },
    delete: { action: 'delete' as Action, subject: 'Department' as Subject },
    manage: { action: 'manage' as Action, subject: 'Department' as Subject },
  },

  // Designation permissions
  designation: {
    read: { action: 'read' as Action, subject: 'Designation' as Subject },
    create: { action: 'create' as Action, subject: 'Designation' as Subject },
    update: { action: 'update' as Action, subject: 'Designation' as Subject },
    delete: { action: 'delete' as Action, subject: 'Designation' as Subject },
    manage: { action: 'manage' as Action, subject: 'Designation' as Subject },
  },

  // Location permissions
  location: {
    read: { action: 'read' as Action, subject: 'Location' as Subject },
    create: { action: 'create' as Action, subject: 'Location' as Subject },
    update: { action: 'update' as Action, subject: 'Location' as Subject },
    delete: { action: 'delete' as Action, subject: 'Location' as Subject },
    manage: { action: 'manage' as Action, subject: 'Location' as Subject },
  },

  // Report permissions
  report: {
    read: { action: 'read' as Action, subject: 'Report' as Subject },
    create: { action: 'create' as Action, subject: 'Report' as Subject },
    update: { action: 'update' as Action, subject: 'Report' as Subject },
    delete: { action: 'delete' as Action, subject: 'Report' as Subject },
    manage: { action: 'manage' as Action, subject: 'Report' as Subject },
  },

  // Leave permissions
  leave: {
    read: { action: 'read' as Action, subject: 'Leave' as Subject },
    create: { action: 'create' as Action, subject: 'Leave' as Subject },
    update: { action: 'update' as Action, subject: 'Leave' as Subject },
    delete: { action: 'delete' as Action, subject: 'Leave' as Subject },
    manage: { action: 'manage' as Action, subject: 'Leave' as Subject },
    approve: { action: 'approve' as Action, subject: 'Leave' as Subject },
    reject: { action: 'reject' as Action, subject: 'Leave' as Subject },
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

/**
 * Simple middleware function for employee users to access their own data
 * This bypasses permission checks for employee role users
 */
// Simple authentication middleware - replaces withEmployeeOwnDataAccess
export function withAuth(
  handler: (request: NextRequest, params?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    try {
      // Ensure Prisma is initialized before any operations
      await initializePrisma();
      
      const session = await getServerSession(authConfig);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      return handler(request, params);
    } catch (error) {
      console.error('❌ Error in withAuth:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
} 