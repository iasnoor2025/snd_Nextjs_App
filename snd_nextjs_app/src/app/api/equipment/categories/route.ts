import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { equipmentCategories } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.equipment.read)(async (_request: NextRequest) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch equipment categories
    const categories = await db
      .select()
      .from(equipmentCategories)
      .where(eq(equipmentCategories.isActive, true))
      .orderBy(equipmentCategories.name);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching equipment categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment categories' },
      { status: 500 }
    );
  }
});

export const POST = withPermission(PermissionConfigs.equipment.create)(async (request: NextRequest) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check for existing category with the same name (case insensitive)
    const existingCategory = await db
      .select()
      .from(equipmentCategories)
      .where(eq(equipmentCategories.name, trimmedName))
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { success: false, message: `Category with name "${trimmedName}" already exists` },
        { status: 400 }
      );
    }

    // Create new category
    const [newCategory] = await db
      .insert(equipmentCategories)
      .values({
        name: trimmedName,
        description: description?.trim() || null,
        icon: icon || '🔧',
        color: color || '#9E9E9E',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Equipment category created successfully',
    });
  } catch (error) {
    console.error('Error creating equipment category:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment category' },
      { status: 500 }
    );
  }
});
