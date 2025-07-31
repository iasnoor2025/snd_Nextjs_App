import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '50');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    // Mock notifications data - in a real app, this would come from a database
    const mockNotifications = [
      {
        id: '1',
        type: 'info' as const,
        title: 'System Update',
        message: 'Your timesheet has been approved for this week.',
        data: { timesheet_id: 123 },
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        action_url: '/timesheets',
        priority: 'medium' as const,
      },
      {
        id: '2',
        type: 'success' as const,
        title: 'Payment Processed',
        message: 'Your advance payment has been processed successfully.',
        data: { payment_id: 456 },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: true,
        action_url: '/payroll',
        priority: 'high' as const,
      },
      {
        id: '3',
        type: 'warning' as const,
        title: 'Equipment Due',
        message: 'Equipment rental is due for return tomorrow.',
        data: { rental_id: 789 },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: false,
        action_url: '/rentals',
        priority: 'high' as const,
      },
      {
        id: '4',
        type: 'error' as const,
        title: 'Login Alert',
        message: 'New login detected from an unrecognized device.',
        data: { device_info: 'Unknown Device' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        read: true,
        action_url: '/profile',
        priority: 'high' as const,
      },
    ];

    // Filter notifications based on query parameters
    let filteredNotifications = mockNotifications;
    
    if (unreadOnly) {
      filteredNotifications = mockNotifications.filter(n => !n.read);
    }

    // Apply pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    // Calculate pagination info
    const total = filteredNotifications.length;
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        pagination: {
          current_page: page,
          last_page: totalPages,
          per_page: perPage,
          total: total,
          from: startIndex + 1,
          to: Math.min(endIndex, total),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
} 