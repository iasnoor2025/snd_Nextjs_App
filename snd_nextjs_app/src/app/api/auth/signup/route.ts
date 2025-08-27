import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users as usersTable, roles as rolesTable, modelHasRoles as modelHasRolesTable } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser[0]) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get default user role (usually "USER" role)
    const defaultRole = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, 'USER'))
      .limit(1);

    const roleId = defaultRole[0]?.id || 2; // Fallback to role ID 2 if "User" role not found

    console.log('Creating user with data:', { firstName, lastName, email, roleId });
    
    // Create user
    const inserted = await db
      .insert(usersTable)
      .values({
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        roleId: roleId,
        status: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role_id: usersTable.roleId,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
      });

    const user = inserted[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user role relationship
    await db.insert(modelHasRolesTable).values({
      userId: user.id as number,
      roleId: roleId,
    });

    // Return success without sensitive data
    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
