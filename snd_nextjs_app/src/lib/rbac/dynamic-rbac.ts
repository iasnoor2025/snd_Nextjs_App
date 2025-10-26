import { db } from '@/lib/drizzle';
import { roles as rolesTable, permissions as permissionsTable, roleHasPermissions as roleHasPermissionsTable } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import' | 'sync' | 'reset';
export type Subject = string; // Dynamic - will be loaded from database
export type UserRole = string; // Dynamic - will be loaded from database

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

// Dynamic role hierarchy - will be loaded from database
export const getRolePriority = async (roleName: string): Promise<number> => {
  try {
    // Get role priority from database or use default
    const role = await db.select().from(rolesTable).where(eq(rolesTable.name, roleName)).limit(1);
    
    if (role[0]?.priority) {
      return role[0].priority;
    }
    
    // Default priority mapping for existing roles (matches database)
    const defaultPriority: Record<string, number> = {
      'SUPER_ADMIN': 1,        // Highest priority - Full system access
      'ADMIN': 2,              // Administrative access
      'MANAGER': 3,            // Management access
      'SUPERVISOR': 4,         // Supervisory access
      'OPERATOR': 5,           // Operational access
      'EMPLOYEE': 6,           // Employee access
      'FINANCE_SPECIALIST': 7, // Finance specialist
      'HR_SPECIALIST': 8,      // HR specialist
      'SALES_REPRESENTATIVE': 9, // Sales representative
      'USER': 999,             // Lowest priority - Basic user access
    };
    
    return defaultPriority[roleName] || 10; // Default priority for new roles
  } catch (error) {
    console.error('Error getting role priority:', error);
    return 10; // Default priority
  }
};

// Get role permissions from database
export const getRolePermissions = async (roleName: string) => {
  try {
    // Get role ID
    const role = await db.select().from(rolesTable).where(eq(rolesTable.name, roleName)).limit(1);
    
    if (!role[0]) {
      return { can: [], cannot: [] };
    }
    
    // Get permissions for this role
    const rolePermissions = await db
      .select({
        permissionName: permissionsTable.name,
        action: permissionsTable.name.split('.')[0] as Action,
        subject: permissionsTable.name.split('.').slice(1).join('.') as Subject,
      })
      .from(roleHasPermissionsTable)
      .innerJoin(permissionsTable, eq(roleHasPermissionsTable.permissionId, permissionsTable.id))
      .where(eq(roleHasPermissionsTable.roleId, role[0].id));
    
    const can = rolePermissions.map(rp => ({
      action: rp.action,
      subject: rp.subject,
    }));
    
    return { can, cannot: [] };
  } catch (error) {
    console.error('Error getting role permissions:', error);
    return { can: [], cannot: [] };
  }
};

// Check if user has permission
export const hasPermission = async (user: User, action: Action, subject: Subject): Promise<boolean> => {
  if (!user || !user.isActive) return false;
  
  try {
    // Permission-based checking: SUPER_ADMIN should have wildcard permissions
    // assigned instead of hardcoded role-based access
    
    // Get user's role permissions
    const permissions = await getRolePermissions(user.role);
    
    if (!permissions) return false;
    
    // Check if user has the specific permission
    const hasCanPermission = permissions.can.some(
      permission =>
        (permission.action === action || permission.action === 'manage') &&
        (permission.subject === subject || permission.subject === 'all')
    );
    
    if (!hasCanPermission) return false;
    
    // Check if there are any restrictions
    if (permissions.cannot) {
      const hasCannotPermission = permissions.cannot.some(
        permission => permission.action === action && permission.subject === subject
      );
      if (hasCannotPermission) return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Check if user has required role or higher
export const hasRequiredRole = async (userRole: UserRole, requiredRoles: UserRole[]): Promise<boolean> => {
  try {
    const userRoleLevel = await getRolePriority(userRole);
    
    for (const requiredRole of requiredRoles) {
      const requiredRoleLevel = await getRolePriority(requiredRole);
      if (userRoleLevel <= requiredRoleLevel) { // Lower number = higher priority
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking required role:', error);
    return false;
  }
};

// Get all available roles
export const getAllRoles = async () => {
  try {
    const roles = await db.select().from(rolesTable).orderBy(rolesTable.name);
    return roles;
  } catch (error) {
    console.error('Error getting roles:', error);
    return [];
  }
};

// Get all available permissions
export const getAllPermissions = async () => {
  try {
    const permissions = await db.select().from(permissionsTable).orderBy(permissionsTable.name);
    return permissions;
  } catch (error) {
    console.error('Error getting permissions:', error);
    return [];
  }
};

// Create user from session
export const createUserFromSession = (session: any): User | null => {
  if (!session?.user) return null;
  
  let role = (session.user.role || 'USER').toUpperCase() as UserRole;
  
  // ALWAYS ensure these emails have SUPER_ADMIN role
  if (session.user.email === 'admin@ias.com' || session.user.email === 'ias.snd2024@gmail.com') {
    role = 'SUPER_ADMIN';
  }
  
  return {
    id: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || '',
    role: role,
    isActive: session.user.isActive || true,
  };
};
