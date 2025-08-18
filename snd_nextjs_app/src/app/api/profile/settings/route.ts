import { NextRequest, NextResponse } from 'next/server';



import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';

// GET /api/profile/settings - Get user settings
export async function GET(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // const userId = session.user.id;
    const { searchParams } = new URL(_request.url);
    const type = searchParams.get('type'); // 'notifications' or 'appearance'

    // Get user settings from database
    // For now, we'll return default settings since we don't have a settings table
    const defaultSettings = {
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        securityAlerts: true,
        weeklyReports: true,
      },
      appearance: {
        theme: 'system',
        language: 'en',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
      },
    };

    if (type === 'notifications') {
      return NextResponse.json(defaultSettings.notifications);
    } else if (type === 'appearance') {
      return NextResponse.json(defaultSettings.appearance);
    }

    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/settings - Update user settings
export async function PUT(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await _request.json();
    const { type, settings } = body;

    if (!type || !settings) {
      return NextResponse.json(
        { error: 'Type and settings are required' },
        { status: 400 }
      );
    }

    // const userId = session.user.id;

    // In a real app, you would save these settings to a database
    // For now, we'll just return success
    console.log(`Updating ${type} settings for user:`, settings);

    return NextResponse.json({
      message: `${type} settings updated successfully`,
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
