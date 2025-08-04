import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        isActive: true,
        created_at: true,
        last_login_at: true,
        user_roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transform the data to include role information
    const usersWithRoles = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.user_roles.length > 0 ? user.user_roles[0].role.name : 'USER',
      role_id: user.role_id,
      isActive: user.isActive,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    }));

    return NextResponse.json(usersWithRoles);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, isActive } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find the role by name
    let roleId = 1; // Default to role ID 1
    if (role) {
      const foundRole = await prisma.role.findFirst({
        where: { name: role },
      });
      if (foundRole) {
        roleId = foundRole.id;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role_id: roleId,
        isActive: isActive !== undefined ? isActive : true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        isActive: true,
        created_at: true,
      },
    });

    // Create user role relationship
    await prisma.userRole.create({
      data: {
        user_id: user.id,
        role_id: roleId,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, password, role, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Find the role by name if role is provided
    let roleId = existingUser.role_id;
    if (role) {
      const foundRole = await prisma.role.findFirst({
        where: { name: role },
      });
      if (foundRole) {
        roleId = foundRole.id;
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      isActive,
      role_id: roleId,
    };

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        isActive: true,
        created_at: true,
      },
    });

    // Update user role relationship if role changed
    if (role && roleId !== existingUser.role_id) {
      // Delete existing user role
      await prisma.userRole.deleteMany({
        where: { user_id: parseInt(id) },
      });

      // Create new user role
      await prisma.userRole.create({
        data: {
          user_id: parseInt(id),
          role_id: roleId,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
