import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { SettingsService } from '@/lib/services/settings-service';

// GET /api/settings - Get settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');
    const publicOnly = searchParams.get('public') === 'true';

    // Public settings don't require authentication
    if (publicOnly) {
      const settings = await SettingsService.getPublicSettings();
      return NextResponse.json({ settings });
    }

    // All other requests require authentication and SUPER_ADMIN role
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only SUPER_ADMIN can access settings
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Super admin access required.' },
        { status: 403 }
      );
    }

    if (key) {
      // Get single setting
      const value = await SettingsService.getSetting(key);
      return NextResponse.json({ key, value });
    }

    if (category) {
      // Get settings by category
      const settings = await SettingsService.getSettingsByCategory(category);
      return NextResponse.json({ settings });
    }

    // Only SUPER_ADMIN can get all settings
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Super admin access required.' },
        { status: 403 }
      );
    }

    const settings = await SettingsService.getAllSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only SUPER_ADMIN can update settings
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Super admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings array is required' },
        { status: 400 }
      );
    }

    await SettingsService.setSettings(settings);

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

