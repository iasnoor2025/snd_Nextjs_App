import { NextRequest, NextResponse } from 'next/server';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { Action, Subject } from '@/lib/rbac/custom-rbac';

export async function POST(request: NextRequest) {
  try {
    const { userId, action, subject } = await request.json();

    // Validate input
    if (!userId || !action || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action, subject' },
        { status: 400 }
      );
    }

    // Validate action and subject
    if (!Object.values(Action).includes(action as Action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    if (!Object.values(Subject).includes(subject as Subject)) {
      return NextResponse.json(
        { error: 'Invalid subject' },
        { status: 400 }
      );
    }

    // Check permission using server-side service
    const result = await checkUserPermission(userId, action as Action, subject as Subject);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Permission check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
