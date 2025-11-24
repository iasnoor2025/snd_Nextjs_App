import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmailWithRoles } from '@/lib/repositories/user-repo';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await findUserByEmailWithRoles(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Determine role
    let role = 'USER';
    if (email === 'admin@ias.com' || email === 'ias.snd2024@gmail.com') {
      role = 'SUPER_ADMIN';
    } else if (user.user_roles && user.user_roles.length > 0) {
      const roleHierarchy = {
        SUPER_ADMIN: 1,
        ADMIN: 2,
        MANAGER: 3,
        SUPERVISOR: 4,
        OPERATOR: 5,
        EMPLOYEE: 6,
        USER: 7,
      };

      let highestRole = 'USER';
      let highestPriority = 7;

      user.user_roles.forEach(userRole => {
        const roleName = userRole.role.name.toUpperCase();
        const priority = roleHierarchy[roleName as keyof typeof roleHierarchy] || 7;
        if (priority < highestPriority) {
          highestPriority = priority;
          highestRole = roleName;
        }
      });

      role = highestRole;
    }

    // Create NextAuth.js compatible JWT token using NextAuth's encode function
    const token = await encode({
      token: {
        sub: user.id.toString(),
        email: user.email,
        name: user.name,
        role: role,
        isActive: user.isActive,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        jti: `mobile-${user.id}-${Date.now()}`,
      },
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development',
    });

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: role,
        isActive: user.isActive,
      },
    });

    // Set session cookie (same format as NextAuth.js)
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Mobile signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
