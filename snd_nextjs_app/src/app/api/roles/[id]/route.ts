import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/roles/[id] - Get role by ID
export async function GET(
  request: NextRequest,
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

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    const roleWithUserCount = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive,
      createdAt: role.createdAt,
      userCount: role._count.users,
    };

    return NextResponse.json(roleWithUserCount);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Update role by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Role name is required' },
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

    // Check if name is being changed and if it conflicts with another role
    if (body.name !== existingRole.name) {
      const conflictingRole = await prisma.role.findUnique({
        where: { name: body.name },
      });

      if (conflictingRole) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || existingRole.description,
        permissions: body.permissions || existingRole.permissions,
        isActive: body.isActive !== undefined ? body.isActive : existingRole.isActive,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    const roleWithUserCount = {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      permissions: updatedRole.permissions,
      isActive: updatedRole.isActive,
      createdAt: updatedRole.createdAt,
      userCount: updatedRole._count.users,
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
