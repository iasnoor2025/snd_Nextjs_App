import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { systemSettings } from '@/lib/drizzle/schema';
import { eq, and, desc, asc, like } from 'drizzle-orm';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

export const GET = withPermission(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isPublic = searchParams.get('is_public');

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        like(systemSettings.key, `%${search}%`)
      );
    }
    
    if (category && category !== 'all') {
      whereConditions.push(eq(systemSettings.category, category));
    }
    
    if (isPublic !== null && isPublic !== undefined) {
      whereConditions.push(eq(systemSettings.isPublic, isPublic === 'true'));
    }

    // Generate cache key based on filters and pagination
    const cacheKey = generateCacheKey('settings', 'list', { page, limit, search, category, isPublic });
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
        // Get total count
        const totalCount = await db
          .select({ count: systemSettings.id })
          .from(systemSettings)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const total = totalCount.length;

        // Get settings with pagination
        const settings = await db
          .select()
          .from(systemSettings)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(asc(systemSettings.category), asc(systemSettings.key))
          .limit(limit)
          .offset(offset);

        const lastPage = Math.ceil(total / limit);

        return NextResponse.json({
          data: settings,
          current_page: page,
          last_page: lastPage,
          per_page: limit,
          total,
          next_page_url: page < lastPage ? `/api/settings?page=${page + 1}&limit=${limit}` : null,
          prev_page_url: page > 1 ? `/api/settings?page=${page - 1}&limit=${limit}` : null,
        });
      },
      {
        ttl: 900, // 15 minutes - settings change less frequently
        tags: [CACHE_TAGS.SETTINGS, CACHE_TAGS.SYSTEM],
      }
    );
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}, PermissionConfigs.settings.read);

export const POST = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      key,
      value,
      type = 'string',
      description,
      isPublic = false,
      category = 'general',
    } = body;

    // Validation
    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    // Check if key already exists
    const existingSetting = await db
      .select({ id: systemSettings.id })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (existingSetting.length > 0) {
      return NextResponse.json({ error: 'Setting key already exists' }, { status: 409 });
    }

    // Create setting
    const [newSetting] = await db
      .insert(systemSettings)
      .values({
        key,
        value: value?.toString() || null,
        type,
        description,
        isPublic,
        category,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newSetting,
      message: 'Setting created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 });
  }
}, PermissionConfigs.settings.create);

export const PUT = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      id,
      key,
      value,
      type,
      description,
      isPublic,
      category,
    } = body;

    // Validation
    if (!id) {
      return NextResponse.json({ error: 'Setting ID is required' }, { status: 400 });
    }

    // Check if setting exists
    const existingSetting = await db
      .select({ id: systemSettings.id })
      .from(systemSettings)
      .where(eq(systemSettings.id, id))
      .limit(1);

    if (existingSetting.length === 0) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Update setting
    const [updatedSetting] = await db
      .update(systemSettings)
      .set({
        key: key || undefined,
        value: value !== undefined ? value.toString() : undefined,
        type: type || undefined,
        description: description !== undefined ? description : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
        category: category || undefined,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedSetting,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}, PermissionConfigs.settings.update);

export const DELETE = withPermission(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Setting ID is required' }, { status: 400 });
    }

    // Check if setting exists
    const existingSetting = await db
      .select({ id: systemSettings.id })
      .from(systemSettings)
      .where(eq(systemSettings.id, parseInt(id)))
      .limit(1);

    if (existingSetting.length === 0) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Delete setting
    await db
      .delete(systemSettings)
      .where(eq(systemSettings.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 });
  }
}, PermissionConfigs.settings.delete);
