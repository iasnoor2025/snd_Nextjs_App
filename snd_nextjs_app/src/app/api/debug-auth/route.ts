import { authOptions } from '@/lib/auth-config';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createUserFromSession } from '@/lib/rbac/custom-rbac';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No session found' 
      });
    }

    const user = createUserFromSession(session);
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'Failed to create user from session' 
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      },
      session: {
        user: session.user,
        expires: session.expires
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
