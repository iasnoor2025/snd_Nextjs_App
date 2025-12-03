import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        user: session.user,
        expires: session.expires,
      },
    });
  } catch (error) {
    console.error('Mobile session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
