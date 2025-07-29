import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'admin@ias.com';

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Test the exact same logic as auth config
    const role = user.role_id === 1 ? "ADMIN" : "USER";
    
    const userData = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: role,
      role_id: user.role_id,
      role_id_type: typeof user.role_id,
      role_id_equals_1: user.role_id === 1,
    };

    return NextResponse.json({
      message: 'User data from database',
      user: userData,
      raw_user: user
    });

  } catch (error) {
    console.error('Debug user API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 