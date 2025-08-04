import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔍 TEST AUTH - Testing login for:', email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        user_roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'User is inactive' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    console.log('🔍 TEST AUTH - User found:', user.name);
    console.log('🔍 TEST AUTH - User role_id:', user.role_id);
    console.log('🔍 TEST AUTH - User user_roles:', user.user_roles?.map(ur => ur.role.name));

    // Determine role based on user_roles or fallback to role_id
    let role = "USER";
    
    if (user.user_roles && user.user_roles.length > 0) {
      const roleHierarchy = {
        'SUPER_ADMIN': 1,
        'ADMIN': 2,
        'MANAGER': 3,
        'SUPERVISOR': 4,
        'OPERATOR': 5,
        'EMPLOYEE': 6,
        'USER': 7
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
      console.log('🔍 TEST AUTH - Role from user_roles:', role);
    } else {
      if (user.role_id === 1) role = 'SUPER_ADMIN';
      else if (user.role_id === 2) role = 'ADMIN';
      else if (user.role_id === 3) role = 'MANAGER';
      else if (user.role_id === 4) role = 'SUPERVISOR';
      else if (user.role_id === 5) role = 'OPERATOR';
      else if (user.role_id === 6) role = 'EMPLOYEE';
      else if (user.role_id === 7) role = 'USER';
      
      console.log('🔍 TEST AUTH - Role from role_id:', role);
    }

    const userData = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: role,
      isActive: user.isActive || true,
    };

    console.log('🔍 TEST AUTH - Final user data:', userData);

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Auth test successful'
    });

  } catch (error) {
    console.error('🔍 TEST AUTH - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 