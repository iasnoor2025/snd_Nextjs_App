import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TEST SESSION - Starting request');
    
    const session = await getServerSession(authConfig);
    console.log('🔍 TEST SESSION - Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : []
    });
    
    return NextResponse.json({
      success: true,
      session: session ? {
        hasSession: true,
        userId: session.user?.id,
        userRole: session.user?.role,
        userEmail: session.user?.email
      } : {
        hasSession: false
      }
    });
  } catch (error) {
    console.error('🔍 TEST SESSION - Error:', error);
    return NextResponse.json({ error: 'Session test failed' }, { status: 500 });
  }
} 