import { authOptions } from '@/lib/auth-config';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function DELETE({ params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // In a real application, you would delete the notification from the database
    // For now, we'll just return a success response

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
      data: {
        notification_id: id,
        deleted: true,
      },
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
