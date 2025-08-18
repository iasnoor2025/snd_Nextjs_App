import { enhancedPermissionService } from './enhanced-permission-service';

/**
 * Enhanced Permission Service Usage Examples
 *
 * This file demonstrates how to use the enhanced permission service
 * with AccessControl-like syntax while maintaining database-driven architecture.
 */

export class PermissionExamples {
  /**
   * Example 1: Basic permission check
   * Similar to AccessControl's can() method
   */
  static async checkBasicPermission(userId: string) {
    // Check if user can read timesheets
    const canReadTimesheets = await enhancedPermissionService.can(userId, 'read', 'timesheet');

    // Check if user can approve timesheets
    const canApproveTimesheets = await enhancedPermissionService.can(
      userId,
      'approve',
      'timesheet'
    );

    // Check if user can approve at foreman stage
    const canApproveForeman = await enhancedPermissionService.can(
      userId,
      'approve',
      'timesheet.foreman'
    );

    return {
      canReadTimesheets,
      canApproveTimesheets,
      canApproveForeman,
    };
  }

  /**
   * Example 2: Check multiple permissions (ANY)
   * Similar to AccessControl's canAny() method
   */
  static async checkAnyPermission(userId: string) {
    const grants = [
      { action: 'approve', resource: 'timesheet.foreman' },
      { action: 'approve', resource: 'timesheet.incharge' },
      { action: 'approve', resource: 'timesheet.checking' },
      { action: 'approve', resource: 'timesheet.manager' },
    ];

    const canApproveAnyStage = await enhancedPermissionService.canAny(userId, grants);

    return { canApproveAnyStage };
  }

  /**
   * Example 3: Check multiple permissions (ALL)
   * Similar to AccessControl's canAll() method
   */
  static async checkAllPermissions(userId: string) {
    const grants = [
      { action: 'read', resource: 'timesheet' },
      { action: 'create', resource: 'timesheet' },
      { action: 'update', resource: 'timesheet' },
    ];

    const canManageTimesheets = await enhancedPermissionService.canAll(userId, grants);

    return { canManageTimesheets };
  }

  /**
   * Example 4: Role-based checks
   * Similar to AccessControl's hasRole() method
   */
  static async checkRoles(userId: string) {
    // Check if user has specific role
    const isManager = await enhancedPermissionService.hasRole(userId, 'MANAGER');

    // Check if user has any of these roles
    const isApprover = await enhancedPermissionService.hasAnyRole(userId, [
      'MANAGER',
      'ADMIN',
      'SUPER_ADMIN',
    ]);

    // Check if user has all of these roles (rare use case)
    const isSuperUser = await enhancedPermissionService.hasAllRoles(userId, ['ADMIN', 'MANAGER']);

    return {
      isManager,
      isApprover,
      isSuperUser,
    };
  }

  /**
   * Example 5: Get user permissions and roles
   * Similar to AccessControl's permissions() method
   */
  static async getUserInfo(userId: string) {
    const permissions = await enhancedPermissionService.getUserPermissions(userId);
    const roles = await enhancedPermissionService.getUserRoles(userId);

    return {
      permissions,
      roles,
    };
  }

  /**
   * Example 6: Grant and revoke permissions
   * Similar to AccessControl's grant() and revoke() methods
   */
  static async managePermissions() {
    // Grant permission to role
    await enhancedPermissionService.grant('MANAGER', 'timesheet', 'approve');
    await enhancedPermissionService.grant('FOREMAN', 'timesheet.foreman', 'approve');

    // Revoke permission from role
    await enhancedPermissionService.revoke('EMPLOYEE', 'timesheet', 'delete');

    console.log('Permissions managed successfully');
  }

  /**
   * Example 7: Complex approval workflow check
   */
  static async checkApprovalWorkflow(userId: string, approvalStage: string) {
    const stagePermissions = {
      foreman: 'approve.timesheet.foreman',
      incharge: 'approve.timesheet.incharge',
      checking: 'approve.timesheet.checking',
      manager: 'approve.timesheet.manager',
    };

    const requiredPermission = stagePermissions[approvalStage as keyof typeof stagePermissions];

    if (!requiredPermission) {
      return { canApprove: false, error: 'Invalid approval stage' };
    }

    const canApprove = await enhancedPermissionService.can(
      userId,
      'approve',
      `timesheet.${approvalStage}`
    );

    return { canApprove };
  }

  /**
   * Example 8: Bulk operations permission check
   */
  static async checkBulkOperations(userId: string) {
    const bulkPermissions = [
      { action: 'bulk.approve', resource: 'timesheet' },
      { action: 'bulk.reject', resource: 'timesheet' },
      { action: 'bulk.approve', resource: 'advance' },
      { action: 'bulk.approve', resource: 'assignment' },
    ];

    const canPerformBulkOperations = await enhancedPermissionService.canAny(
      userId,
      bulkPermissions
    );

    return { canPerformBulkOperations };
  }

  /**
   * Example 9: Conditional permission check
   */
  static async checkConditionalPermission(userId: number, action: string) {
    // Get user roles to check conditional permissions
    const roles = await enhancedPermissionService.getUserRoles(userId.toString());

    // Example: Only managers can approve their own team's timesheets
    if (action === 'approve' && roles.includes('MANAGER')) {
      // Additional logic to check if timesheet belongs to manager's team
      // This would require additional database queries
      return { canPerform: true, reason: 'Manager can approve team timesheets' };
    }

    // Default permission check
    const canPerform = await enhancedPermissionService.can(userId, action, 'timesheet');

    return { canPerform };
  }

  /**
   * Example 10: API route permission wrapper
   */
  static async apiRoutePermissionCheck(userId: number, action: string, resource: string) {
    try {
      const hasPermission = await enhancedPermissionService.can(userId, action, resource);

      if (!hasPermission) {
        return {
          authorized: false,
          error: `User does not have ${action} permission on ${resource}`,
          status: 403,
        };
      }

      return {
        authorized: true,
        status: 200,
      };
    } catch (error) {
      return {
        authorized: false,
        error: 'Error checking permissions',
        status: 500,
      };
    }
  }
}

/**
 * Usage in API routes:
 *
 * import { enhancedPermissionService } from '@/lib/rbac/enhanced-permission-service';
 *
 * export async function POST(_request: NextRequest) {
 *   const userId = request.headers.get('user-id');
 *
 *   // Check permission
 *   const canApprove = await enhancedPermissionService.can(userId, 'approve', 'timesheet');
 *
 *   if (!canApprove) {
 *     return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
 *   }
 *
 *   // Proceed with API logic
 *   // ...
 * }
 *
 * Usage in components:
 *
 * const checkPermission = async () => {
 *   const canEdit = await enhancedPermissionService.can(userId, 'update', 'employee');
 *   setCanEdit(canEdit);
 * };
 */
