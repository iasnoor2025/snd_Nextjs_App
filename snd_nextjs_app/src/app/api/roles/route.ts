import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
// GET /api/roles - Get all roles with user count
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            user_roles: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transform the data to include userCount
    const rolesWithUserCount = roles.map(role => ({
      id: role.id,
      name: role.name,
      guard_name: role.guard_name,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      userCount: role._count.user_roles,
    }));

    return NextResponse.json(rolesWithUserCount);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, guard_name } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name,
        guard_name: guard_name || 'web',
      },
      include: {
        _count: {
          select: {
            user_roles: true,
          },
        },
      },
    });

    const roleWithUserCount = {
      id: role.id,
      name: role.name,
      guard_name: role.guard_name,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      userCount: role._count.user_roles,
    };

    return NextResponse.json(roleWithUserCount, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

// PUT /api/roles - Update role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, guard_name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it's already taken
    if (name && name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Role name already exists' },
          { status: 400 }
        );
      }
    }

    // Update role
    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        guard_name,
      },
      include: {
        _count: {
          select: {
            user_roles: true,
          },
        },
      },
    });

    const roleWithUserCount = {
      id: role.id,
      name: role.name,
      guard_name: role.guard_name,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      userCount: role._count.user_roles,
    };

    return NextResponse.json(roleWithUserCount);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles - Delete role
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            user_roles: true,
          },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role has users assigned
    if (existingRole._count.user_roles > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users' },
        { status: 400 }
      );
    }

    // Delete role
    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
