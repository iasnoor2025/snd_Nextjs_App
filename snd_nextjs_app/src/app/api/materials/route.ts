import { db } from '@/lib/drizzle';
import { materials } from '@/lib/drizzle/schema';
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

    // Fetch materials
    const materialsList = await db
      .select()
      .from(materials)
      .where(eq(materials.isActive, true))
      .orderBy(materials.name);

    return NextResponse.json({
      success: true,
      data: materialsList,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch materials',
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
    const { name, description, category, unit } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Material name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check for existing material with the same name
    const existingMaterial = await db
      .select()
      .from(materials)
      .where(eq(materials.name, trimmedName))
      .limit(1);

    if (existingMaterial.length > 0) {
      return NextResponse.json(
        { success: false, message: `Material with name "${trimmedName}" already exists` },
        { status: 400 }
      );
    }

    // Create new material
    const [newMaterial] = await db
      .insert(materials)
      .values({
        name: trimmedName,
        description: description?.trim() || null,
        category: category?.trim() || null,
        unit: unit?.trim() || null,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newMaterial,
      message: 'Material created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to create material',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
});

