import { authConfig } from '@/lib/auth-config';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No session found' 
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      session: session
    });
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      authenticated: false 
    }, { status: 500 });
  }
}
