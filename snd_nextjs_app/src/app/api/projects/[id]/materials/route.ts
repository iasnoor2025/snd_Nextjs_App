import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectMaterials, projects, employees } from '@/lib/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Build where conditions
    const whereConditions = [eq(projectMaterials.projectId, parseInt(projectId))];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(projectMaterials.status, status));
    }
    
    if (category && category !== 'all') {
      whereConditions.push(eq(projectMaterials.category, category));
    }

    // Fetch materials with related data
    const materials = await db
      .select({
        id: projectMaterials.id,
        projectId: projectMaterials.projectId,
        name: projectMaterials.name,
        description: projectMaterials.description,
        category: projectMaterials.category,
        unit: projectMaterials.unit,
        quantity: projectMaterials.quantity,
        unitPrice: projectMaterials.unitPrice,
        totalCost: projectMaterials.totalCost,
        supplier: projectMaterials.supplier,
        orderDate: projectMaterials.orderDate,
        deliveryDate: projectMaterials.deliveryDate,
        status: projectMaterials.status,
        notes: projectMaterials.notes,
        assignedTo: projectMaterials.assignedTo,
        createdAt: projectMaterials.createdAt,
        updatedAt: projectMaterials.updatedAt,
        assignedToName: employees.firstName,
        assignedToLastName: employees.lastName,
      })
      .from(projectMaterials)
      .leftJoin(employees, eq(projectMaterials.assignedTo, employees.id))
      .where(and(...whereConditions))
      .orderBy(desc(projectMaterials.createdAt));

    // Transform to match frontend expectations
    const materialsWithType = materials.map(item => ({
      ...item,
      total_cost: Number(item.totalCost) || 0,
      type: 'material' // Add type for frontend categorization
    }));

    return NextResponse.json({ 
      success: true,
      data: materialsWithType 
    });
  } catch (error) {
    console.error('Error fetching project materials:', error);
    return NextResponse.json({ error: 'Failed to fetch project materials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      unit,
      quantity,
      unitPrice,
      supplier,
      orderDate,
      notes,
    } = body;

    // Validation
    if (!name || !category || !unit || !quantity || !unitPrice) {
      return NextResponse.json({ error: 'Name, category, unit, quantity, and unit price are required' }, { status: 400 });
    }

    // Calculate total cost
    const totalCost = parseFloat(quantity) * parseFloat(unitPrice);

    // Create material
    const [newMaterial] = await db
      .insert(projectMaterials)
      .values({
        projectId: parseInt(projectId),
        name,
        description,
        category,
        unit,
        quantity: parseFloat(quantity).toString(),
        unitPrice: parseFloat(unitPrice).toString(),
        totalCost: totalCost.toString(),
        supplier,
        orderDate: orderDate ? new Date(orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: 'ordered',
        notes,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      data: newMaterial,
      message: 'Material added successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding material:', error);
    return NextResponse.json({ error: 'Failed to add material' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get query parameters for material ID
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('id');

    if (!materialId || isNaN(parseInt(materialId))) {
      return NextResponse.json({ error: 'Invalid material ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify material exists and belongs to the project
    const existingMaterial = await db
      .select()
      .from(projectMaterials)
      .where(
        and(
          eq(projectMaterials.id, parseInt(materialId)),
          eq(projectMaterials.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingMaterial.length === 0) {
      return NextResponse.json({ error: 'Material resource not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      materialName,
      quantity,
      unit,
      unitPrice,
      totalCost,
      supplier,
      deliveryDate,
      notes,
      status,
    } = body;

    // Update material
    const [updatedMaterial] = await db
      .update(projectMaterials)
      .set({
        ...(materialName !== undefined && { materialName }),
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(unit !== undefined && { unit }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(totalCost !== undefined && { totalCost: parseFloat(totalCost) }),
        ...(supplier !== undefined && { supplier }),
        ...(deliveryDate !== undefined && { deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString().split('T')[0] : null }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(projectMaterials.id, parseInt(materialId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedMaterial,
      message: 'Material resource updated successfully'
    });
  } catch (error) {
    console.error('Error updating project material:', error);
    return NextResponse.json({ error: 'Failed to update project material' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get query parameters for material ID
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('id');

    if (!materialId || isNaN(parseInt(materialId))) {
      return NextResponse.json({ error: 'Invalid material ID' }, { status: 400 });
    }

    // Verify material exists and belongs to the project
    const existingMaterial = await db
      .select()
      .from(projectMaterials)
      .where(
        and(
          eq(projectMaterials.id, parseInt(materialId)),
          eq(projectMaterials.projectId, parseInt(projectId))
        )
      )
      .limit(1);

    if (existingMaterial.length === 0) {
      return NextResponse.json({ error: 'Material resource not found' }, { status: 404 });
    }

    // Delete material
    await db
      .delete(projectMaterials)
      .where(eq(projectMaterials.id, parseInt(materialId)));

    return NextResponse.json({
      success: true,
      message: 'Material resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project material:', error);
    return NextResponse.json({ error: 'Failed to delete project material' }, { status: 500 });
  }
}
