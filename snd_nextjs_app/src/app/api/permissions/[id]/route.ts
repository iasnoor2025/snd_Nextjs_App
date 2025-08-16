import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { hasPermission, createUserFromSession } from '@/lib/rbac/custom-rbac';

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

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        role_permissions: {
          include: {
            role: true,
          },
        },
        user_permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    return NextResponse.json({ permission });
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

    const body = await _request.json();
    const { name, guard_name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check if new name conflicts with existing permission
    if (name !== existingPermission.name) {
      const nameConflict = await prisma.permission.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Permission name already exists' },
          { status: 409 }
        );
      }
    }

    // Update permission
    const updatedPermission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        name,
        guard_name: guard_name || existingPermission.guard_name,
      },
    });

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

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        role_permissions: true,
        user_permissions: true,
      },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check if permission is in use
    if (existingPermission.role_permissions.length > 0 || existingPermission.user_permissions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete permission that is assigned to roles or users',
          details: {
            roleAssignments: existingPermission.role_permissions.length,
            userAssignments: existingPermission.user_permissions.length,
          }
        },
        { status: 409 }
      );
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id: permissionId },
    });

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