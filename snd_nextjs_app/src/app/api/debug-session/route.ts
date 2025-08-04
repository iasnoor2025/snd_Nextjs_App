import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get JWT token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      return NextResponse.json({
        error: 'No token found',
        authenticated: false
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        isActive: token.isActive
      },
      token: {
        sub: token.sub,
        iat: token.iat,
        exp: token.exp
      }
    });

  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 