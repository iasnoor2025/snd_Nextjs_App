import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { permissions, roleHasPermissions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // Get all permissions for this role using Drizzle
    const rolePermissionRows = await db
      .select({
        permissionId: roleHasPermissions.permissionId,
        permission: {
                  id: permissions.id,
        name: permissions.name,
        }
      })
      .from(roleHasPermissions)
      .leftJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
      .where(eq(roleHasPermissions.roleId, roleId));

    const rolePermissions = rolePermissionRows.map(row => ({
      id: row.permissionId,
      name: row.permission?.name || '',
    }));

    return NextResponse.json({
      success: true,
      data: rolePermissions,
      message: 'Role permissions retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role permissions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { permissionIds } = body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: 'Permission IDs array is required' },
        { status: 400 }
      );
    }

    // First, remove all existing permissions for this role
    await db
      .delete(roleHasPermissions)
      .where(eq(roleHasPermissions.roleId, roleId));

    // Then add the new permissions
    if (permissionIds.length > 0) {
      const permissionValues = permissionIds.map((permissionId: number) => ({
        roleId: roleId,
        permissionId: permissionId,
      }));

      await db
        .insert(roleHasPermissions)
        .values(permissionValues);
    }

    return NextResponse.json({
      success: true,
      message: 'Role permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // Remove all permissions for this role
    await db
      .delete(roleHasPermissions)
      .where(eq(roleHasPermissions.roleId, roleId));

    return NextResponse.json({
      success: true,
      message: 'All role permissions removed successfully'
    });
  } catch (error) {
    console.error('Error removing role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to remove role permissions' },
      { status: 500 }
    );
  }
} 