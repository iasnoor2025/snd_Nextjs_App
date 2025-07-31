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
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            user_roles: true,
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
      description: '', // Role model doesn't have description field
      permissions: [], // Role model doesn't have permissions field
      isActive: true, // Role model doesn't have isActive field
      createdAt: role.created_at,
      userCount: role._count.user_roles,
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
      where: { id: parseInt(id) },
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
      where: { id: parseInt(id) },
      data: {
        name: body.name,
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
      id: updatedRole.id,
      name: updatedRole.name,
      description: '', // Role model doesn't have description field
      permissions: [], // Role model doesn't have permissions field
      isActive: true, // Role model doesn't have isActive field
      createdAt: updatedRole.created_at,
      userCount: updatedRole._count.user_roles,
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
