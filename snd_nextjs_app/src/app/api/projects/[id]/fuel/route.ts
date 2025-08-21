import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectFuel, projects, equipment, employees } from '@/lib/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
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
    const fuelType = searchParams.get('fuel_type');

    // Build where conditions
    const whereConditions = [eq(projectFuel.projectId, parseInt(projectId))];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(projectFuel.status, status));
    }
    
    if (fuelType && fuelType !== 'all') {
      whereConditions.push(eq(projectFuel.fuelType, fuelType));
    }

    // Fetch fuel with related data
    const fuelList = await db
      .select({
        id: projectFuel.id,
        projectId: projectFuel.projectId,
        fuelType: projectFuel.fuelType,
        quantity: projectFuel.quantity,
        unitPrice: projectFuel.unitPrice,
        totalCost: projectFuel.totalCost,
        supplier: projectFuel.supplier,
        purchaseDate: projectFuel.purchaseDate,
        equipmentId: projectFuel.equipmentId,
        operatorId: projectFuel.operatorId,
        usageNotes: projectFuel.usageNotes,
        status: projectFuel.status,
        createdAt: projectFuel.createdAt,
        updatedAt: projectFuel.updatedAt,
        equipmentName: equipment.name,
        operatorName: employees.firstName,
        operatorLastName: employees.lastName,
      })
      .from(projectFuel)
      .leftJoin(equipment, eq(projectFuel.equipmentId, equipment.id))
      .leftJoin(employees, eq(projectFuel.operatorId, employees.id))
      .where(and(...whereConditions))
      .orderBy(desc(projectFuel.purchaseDate));

    // Transform to match frontend expectations
    const fuelWithType = fuelList.map(item => ({
      ...item,
      total_cost: Number(item.totalCost) || 0,
      type: 'fuel' // Add type for frontend categorization
    }));

    return NextResponse.json({ 
      success: true,
      data: fuelWithType 
    });
  } catch (error) {
    console.error('Error fetching project fuel:', error);
    return NextResponse.json({ error: 'Failed to fetch project fuel' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
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
      fuelType,
      quantity,
      unitPrice,
      supplier,
      equipmentId,
      operatorId,
      usageNotes,
    } = body;

    // Validation
    if (!fuelType || !quantity || !unitPrice) {
      return NextResponse.json({ error: 'Fuel type, quantity, and unit price are required' }, { status: 400 });
    }

    // Calculate total cost
    const totalCost = parseFloat(quantity) * parseFloat(unitPrice);

    // Create fuel record
    const [newFuel] = await db
      .insert(projectFuel)
      .values({
        projectId: parseInt(projectId),
        fuelType,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalCost,
        supplier,
        purchaseDate: new Date(),
        equipmentId: equipmentId ? parseInt(equipmentId) : null,
        operatorId: operatorId ? parseInt(operatorId) : null,
        usageNotes,
        status: 'purchased',
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      data: newFuel,
      message: 'Fuel record added successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding fuel record:', error);
    return NextResponse.json({ error: 'Failed to add fuel record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get fuel ID from query params
    const { searchParams } = new URL(request.url);
    const fuelId = searchParams.get('id');

    if (!fuelId || isNaN(parseInt(fuelId))) {
      return NextResponse.json({ error: 'Invalid fuel ID' }, { status: 400 });
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

    // Verify fuel record exists
    const existingFuel = await db
      .select({ id: projectFuel.id })
      .from(projectFuel)
      .where(and(
        eq(projectFuel.id, parseInt(fuelId)),
        eq(projectFuel.projectId, parseInt(projectId))
      ))
      .limit(1);

    if (existingFuel.length === 0) {
      return NextResponse.json({ error: 'Fuel record not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      fuelType,
      quantity,
      unitPrice,
      supplier,
      equipmentId,
      operatorId,
      usageNotes,
      status,
    } = body;

    // Validation
    if (!fuelType || !quantity || !unitPrice) {
      return NextResponse.json({ error: 'Fuel type, quantity, and unit price are required' }, { status: 400 });
    }

    // Calculate total cost
    const totalCost = parseFloat(quantity) * parseFloat(unitPrice);

    // Update fuel record
    const [updatedFuel] = await db
      .update(projectFuel)
      .set({
        fuelType,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalCost,
        supplier,
        equipmentId: equipmentId ? parseInt(equipmentId) : null,
        operatorId: operatorId ? parseInt(operatorId) : null,
        usageNotes,
        status: status || 'purchased',
        updatedAt: new Date(),
      })
      .where(eq(projectFuel.id, parseInt(fuelId)))
      .returning();

    return NextResponse.json({ 
      success: true,
      data: updatedFuel,
      message: 'Fuel record updated successfully' 
    });
  } catch (error) {
    console.error('Error updating fuel record:', error);
    return NextResponse.json({ error: 'Failed to update fuel record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get fuel ID from query params
    const { searchParams } = new URL(request.url);
    const fuelId = searchParams.get('id');

    if (!fuelId || isNaN(parseInt(fuelId))) {
      return NextResponse.json({ error: 'Invalid fuel ID' }, { status: 400 });
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

    // Verify fuel record exists
    const existingFuel = await db
      .select({ id: projectFuel.id })
      .from(projectFuel)
      .where(and(
        eq(projectFuel.id, parseInt(fuelId)),
        eq(projectFuel.projectId, parseInt(projectId))
      ))
      .limit(1);

    if (existingFuel.length === 0) {
      return NextResponse.json({ error: 'Fuel record not found' }, { status: 404 });
    }

    // Delete fuel record
    await db
      .delete(projectFuel)
      .where(eq(projectFuel.id, parseInt(fuelId)));

    return NextResponse.json({ 
      success: true,
      message: 'Fuel record deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting fuel record:', error);
    return NextResponse.json({ error: 'Failed to delete fuel record' }, { status: 500 });
  }
}
