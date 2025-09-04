import { NextRequest, NextResponse } from 'next/server';
import { getUserAccessibleSectionsServer } from '@/lib/rbac/server-dashboard-permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get accessible sections using server-side function
    const sections = await getUserAccessibleSectionsServer(userId);

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Get accessible sections API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
