import { db } from '@/lib/drizzle';
import { expenseCategories } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.project.read)(async (_request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch expense categories
    const categories = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.isActive, true))
      .orderBy(expenseCategories.name);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch expense categories',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
});

export const POST = withPermission(PermissionConfigs.project.create)(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
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

    // Check for existing category with the same name
    const existingCategory = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.name, trimmedName))
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { success: false, message: `Category with name "${trimmedName}" already exists` },
        { status: 400 }
      );
    }

    // Create new category
    const [newCategory] = await db
      .insert(expenseCategories)
      .values({
        name: trimmedName,
        description: description?.trim() || null,
        icon: icon || '💰',
        color: color || '#EF4444',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Expense category created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense category:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to create expense category',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
});

