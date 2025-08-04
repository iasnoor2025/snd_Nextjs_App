import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { JWT } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No active session found' }, { status: 401 });
    }

    console.log('🔄 Force updating session for user:', session.user.email);

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
        const priority = (roleHierarchy as Record<string, number>)[roleName] || 7;
        if (priority < highestPriority) {
          highestPriority = priority;
          highestRole = roleName;
        }
      });
      
      role = highestRole;
    } else {
      // Fallback to role_id mapping
      if (user.role_id === 1) {
        role = "SUPER_ADMIN";
      } else if (user.role_id === 2) {
        role = "ADMIN";
      } else if (user.role_id === 3) {
        role = "MANAGER";
      } else if (user.role_id === 4) {
        role = "SUPERVISOR";
      } else if (user.role_id === 5) {
        role = "OPERATOR";
      } else if (user.role_id === 6) {
        role = "EMPLOYEE";
      } else if (user.role_id === 7) {
        role = "USER";
      }
    }

    console.log('🔍 User role_id:', user.role_id);
    console.log('🔍 User roles:', user.user_roles?.map(ur => ur.role.name));
    console.log('🔍 Assigned role:', role);

    // Create updated user data
    const updatedUserData = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: role,
      isActive: user.isActive || true,
    };

    return NextResponse.json({
      success: true,
      message: 'Session force update successful',
      user: updatedUserData,
      debug: {
        role_id: user.role_id,
        user_roles: user.user_roles?.map(ur => ur.role.name),
        assigned_role: role,
        previous_role: session.user.role
      }
    });

  } catch (error) {
    console.error('Session force update error:', error);
    return NextResponse.json({ error: 'Failed to force update session' }, { status: 500 });
  }
} 