
import { db } from '@/lib/drizzle';
import { equipmentCategories } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { sql } from 'drizzle-orm';

export const GET = withPermission(PermissionConfigs.equipment.read)(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await db
      .select()
      .from(equipmentCategories)
      .where(eq(equipmentCategories.id, categoryId))
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Equipment category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category[0],
    });
  } catch (error) {
    console.error('Error fetching equipment category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment category' },
      { status: 500 }
    );
  }
});

export const PUT = withPermission(PermissionConfigs.equipment.update)(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);
    const body = await request.json();
    const { name, description, icon, color, isActive } = body;

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db
      .select()
      .from(equipmentCategories)
      .where(eq(equipmentCategories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Equipment category not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current category)
    const duplicateCategory = await db
      .select()
      .from(equipmentCategories)
      .where(eq(equipmentCategories.name, name.trim()))
      .limit(1);

    if (duplicateCategory.length > 0 && duplicateCategory[0].id !== categoryId) {
      return NextResponse.json(
        { success: false, message: `Category with name "${name.trim()}" already exists` },
        { status: 400 }
      );
    }

    // Update category
    const [updatedCategory] = await db
      .update(equipmentCategories)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
        color: color || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(equipmentCategories.id, categoryId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Equipment category updated successfully',
    });
  } catch (error) {
    console.error('Error updating equipment category:', error);
    return NextResponse.json(
      { error: 'Failed to update equipment category' },
      { status: 500 }
    );
  }
});

export const DELETE = withPermission(PermissionConfigs.equipment.delete)(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db
      .select()
      .from(equipmentCategories)
      .where(eq(equipmentCategories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Equipment category not found' },
        { status: 404 }
      );
    }

    // Check if category is being used by any equipment
    const equipmentUsingCategory = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sql`equipment`)
      .where(sql`category_id = ${categoryId}`);

    const count = Number(equipmentUsingCategory[0]?.count || 0);
    if (count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete category. It is being used by ${count} equipment items.` 
        },
        { status: 400 }
      );
    }

    // Delete category
    await db
      .delete(equipmentCategories)
      .where(eq(equipmentCategories.id, categoryId));

    return NextResponse.json({
      success: true,
      message: 'Equipment category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting equipment category:', error);
    return NextResponse.json(
      { error: 'Failed to delete equipment category' },
      { status: 500 }
    );
  }
});
