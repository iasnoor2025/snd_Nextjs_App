import { db } from '@/lib/drizzle';
import { materials } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { sql } from 'drizzle-orm';

export const GET = withPermission(PermissionConfigs.project.read)(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const materialId = parseInt(id);

    if (isNaN(materialId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid material ID' },
        { status: 400 }
      );
    }

    const material = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (material.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: material[0],
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch material',
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
    const materialId = parseInt(id);
    const body = await request.json();
    const { name, description, category, unit, isActive } = body;

    if (isNaN(materialId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid material ID' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Material name is required' },
        { status: 400 }
      );
    }

    // Check if material exists
    const existingMaterial = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (existingMaterial.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Material not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current material)
    const duplicateMaterial = await db
      .select()
      .from(materials)
      .where(eq(materials.name, name.trim()))
      .limit(1);

    if (duplicateMaterial.length > 0 && duplicateMaterial[0].id !== materialId) {
      return NextResponse.json(
        { success: false, message: `Material with name "${name.trim()}" already exists` },
        { status: 400 }
      );
    }

    // Update material
    const [updatedMaterial] = await db
      .update(materials)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        unit: unit?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(materials.id, materialId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedMaterial,
      message: 'Material updated successfully',
    });
  } catch (error) {
    console.error('Error updating material:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to update material',
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
    const materialId = parseInt(id);

    if (isNaN(materialId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid material ID' },
        { status: 400 }
      );
    }

    // Check if material exists
    const existingMaterial = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (existingMaterial.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Material not found' },
        { status: 404 }
      );
    }

    // Check if material is being used by any project materials
    const projectMaterialsUsingMaterial = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sql`project_materials`)
      .where(sql`name = ${existingMaterial[0].name}`);

    const count = Number(projectMaterialsUsingMaterial[0]?.count || 0);
    if (count > 0) {
      // Soft delete by setting isActive to false instead of hard delete
      await db
        .update(materials)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(eq(materials.id, materialId));

      return NextResponse.json({
        success: true,
        message: 'Material deactivated successfully (it is being used in projects)',
      });
    }

    // Hard delete if not in use
    await db
      .delete(materials)
      .where(eq(materials.id, materialId));

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to delete material',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
});

