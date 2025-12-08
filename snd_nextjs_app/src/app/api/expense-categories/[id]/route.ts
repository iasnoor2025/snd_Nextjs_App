import { db } from '@/lib/drizzle';
import { expenseCategories } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { sql } from 'drizzle-orm';

export const GET = withPermission(PermissionConfigs.project.read)(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      .from(expenseCategories)
      .where(eq(expenseCategories.id, categoryId))
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Expense category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category[0],
    });
  } catch (error) {
    console.error('Error fetching expense category:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch expense category',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
});

export const PUT = withPermission(PermissionConfigs.project.update)(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      .from(expenseCategories)
      .where(eq(expenseCategories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Expense category not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current category)
    const duplicateCategory = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.name, name.trim()))
      .limit(1);

    if (duplicateCategory.length > 0 && duplicateCategory[0].id !== categoryId) {
      return NextResponse.json(
        { success: false, message: `Category with name "${name.trim()}" already exists` },
        { status: 400 }
      );
    }

    // Update category
    const [updatedCategory] = await db
      .update(expenseCategories)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
        color: color || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(expenseCategories.id, categoryId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Expense category updated successfully',
    });
  } catch (error) {
    console.error('Error updating expense category:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to update expense category',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
});

export const DELETE = withPermission(PermissionConfigs.project.delete)(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      .from(expenseCategories)
      .where(eq(expenseCategories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Expense category not found' },
        { status: 404 }
      );
    }

    // Check if category is being used by any project expenses
    const projectExpensesUsingCategory = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sql`project_expenses`)
      .where(sql`category = ${existingCategory[0].name}`);

    const count = Number(projectExpensesUsingCategory[0]?.count || 0);
    if (count > 0) {
      // Soft delete by setting isActive to false instead of hard delete
      await db
        .update(expenseCategories)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(eq(expenseCategories.id, categoryId));

      return NextResponse.json({
        success: true,
        message: 'Expense category deactivated successfully (it is being used in projects)',
      });
    }

    // Hard delete if not in use
    await db
      .delete(expenseCategories)
      .where(eq(expenseCategories.id, categoryId));

    return NextResponse.json({
      success: true,
      message: 'Expense category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to delete expense category',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
});

