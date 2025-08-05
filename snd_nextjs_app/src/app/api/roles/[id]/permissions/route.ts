import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { hasPermission, createUserFromSession } from '@/lib/rbac/custom-rbac';

// GET /api/roles/[id]/permissions - Get permissions for a role
export async function GET(
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

    // Check if user has permission to view role permissions
    if (!hasPermission(user, 'read', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    // Get role with its permissions
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        role_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Get all available permissions for comparison
    const allPermissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      role,
      permissions: role.role_permissions.map(rp => rp.permission),
      allPermissions,
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/roles/[id]/permissions - Assign permissions to role
export async function POST(
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

    // Check if user has permission to manage role permissions
    if (!hasPermission(user, 'update', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const body = await request.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: 'Permission IDs must be an array' },
        { status: 400 }
      );
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Validate that all permission IDs exist
    const permissions = await prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
      },
    });

    if (permissions.length !== permissionIds.length) {
      return NextResponse.json(
        { error: 'One or more permission IDs are invalid' },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Remove all existing role permissions
      await tx.rolePermission.deleteMany({
        where: { role_id: roleId },
      });

      // Add new role permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            role_id: roleId,
            permission_id: permissionId,
          })),
        });
      }
    });

    return NextResponse.json({
      message: 'Role permissions updated successfully',
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id]/permissions - Remove all permissions from role
export async function DELETE(
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

    // Check if user has permission to manage role permissions
    if (!hasPermission(user, 'update', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const roleId = parseInt(id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Remove all permissions from role
    await prisma.rolePermission.deleteMany({
      where: { role_id: roleId },
    });

    return NextResponse.json({
      message: 'All permissions removed from role successfully',
    });
  } catch (error) {
    console.error('Error removing role permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 