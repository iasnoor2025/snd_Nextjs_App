import { NextRequest, NextResponse } from 'next/server';
import { hasSectionPermissionServer } from '@/lib/rbac/server-dashboard-permissions';

export async function POST(request: NextRequest) {
  try {
    const { userId, section } = await request.json();

    // Validate input
    if (!userId || !section) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, section' },
        { status: 400 }
      );
    }

    // Check section permission using server-side function
    const hasPermission = await hasSectionPermissionServer(userId, section);

    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error('Section permission check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
