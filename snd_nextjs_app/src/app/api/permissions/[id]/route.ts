import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { permissions, roleHasPermissions, modelHasPermissions, roles, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { hasPermission, createUserFromSession } from '@/lib/rbac/custom-rbac';
import { sql } from 'drizzle-orm';

// GET /api/permissions/[id] - Get specific permission
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserFromSession(session);
    if (!user) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Check if user has permission to view permissions
    if (!hasPermission(user, 'read', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const permissionId = parseInt(id);
    if (isNaN(permissionId)) {
      return NextResponse.json({ error: 'Invalid permission ID' }, { status: 400 });
    }

    // Get permission with role and user assignments using Drizzle
    const permissionRows = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        guardName: permissions.guardName,
        createdAt: permissions.createdAt,
        updatedAt: permissions.updatedAt,
      })
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (permissionRows.length === 0) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    const permission = permissionRows[0]!;

    // Get role assignments for this permission
    const roleAssignments = await db
      .select({
        roleId: roleHasPermissions.roleId,
        roleName: roles.name,
      })
      .from(roleHasPermissions)
      .leftJoin(roles, eq(roleHasPermissions.roleId, roles.id))
      .where(eq(roleHasPermissions.permissionId, permissionId));

    // Get user assignments for this permission
    const userAssignments = await db
      .select({
        userId: modelHasPermissions.modelId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(modelHasPermissions)
      .leftJoin(users, eq(modelHasPermissions.modelId, users.id))
      .where(eq(modelHasPermissions.permissionId, permissionId));

    const permissionWithAssignments = {
      ...permission,
      role_permissions: roleAssignments,
      user_permissions: userAssignments,
    };

    return NextResponse.json({ permission: permissionWithAssignments });
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/permissions/[id] - Update permission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserFromSession(session);
    if (!user) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Check if user has permission to update permissions
    if (!hasPermission(user, 'update', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const permissionId = parseInt(id);
    if (isNaN(permissionId)) {
      return NextResponse.json({ error: 'Invalid permission ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, guard_name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // Check if permission exists
    const existingPermissionRows = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        guardName: permissions.guardName,
      })
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (existingPermissionRows.length === 0) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    const existingPermission = existingPermissionRows[0]!;

    // Check if new name conflicts with existing permission
    if (name !== existingPermission.name) {
      const nameConflictRows = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.name, name))
        .limit(1);

      if (nameConflictRows.length > 0) {
        return NextResponse.json(
          { error: 'Permission name already exists' },
          { status: 409 }
        );
      }
    }

    // Update permission using Drizzle
    const updatedPermissionRows = await db
      .update(permissions)
      .set({
        name,
        guardName: guard_name || existingPermission.guardName,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(permissions.id, permissionId))
      .returning();

    const updatedPermission = updatedPermissionRows[0]!;

    return NextResponse.json({
      message: 'Permission updated successfully',
      permission: updatedPermission,
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/permissions/[id] - Delete permission
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserFromSession(session);
    if (!user) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Check if user has permission to delete permissions
    if (!hasPermission(user, 'delete', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const permissionId = parseInt(id);
    if (isNaN(permissionId)) {
      return NextResponse.json({ error: 'Invalid permission ID' }, { status: 400 });
    }

    // Check if permission exists and get assignments
    const existingPermissionRows = await db
      .select({
        id: permissions.id,
        name: permissions.name,
      })
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (existingPermissionRows.length === 0) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check role assignments
    const roleAssignments = await db
      .select({ count: sql<number>`count(*)` })
      .from(roleHasPermissions)
      .where(eq(roleHasPermissions.permissionId, permissionId));

    // Check user assignments
    const userAssignments = await db
      .select({ count: sql<number>`count(*)` })
      .from(modelHasPermissions)
      .where(eq(modelHasPermissions.permissionId, permissionId));

    const roleAssignmentCount = Number(roleAssignments[0]?.count || 0);
    const userAssignmentCount = Number(userAssignments[0]?.count || 0);

    // Check if permission is in use
    if (roleAssignmentCount > 0 || userAssignmentCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete permission that is assigned to roles or users',
          details: {
            roleAssignments: roleAssignmentCount,
            userAssignments: userAssignmentCount,
          }
        },
        { status: 409 }
      );
    }

    // Delete permission using Drizzle
    await db
      .delete(permissions)
      .where(eq(permissions.id, permissionId));

    return NextResponse.json({
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 