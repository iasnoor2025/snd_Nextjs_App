import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

import { db } from '@/lib/drizzle';
import { employeeTraining } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// DELETE /api/employee-training/[id] - Delete employee training record by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const trainingRecordId = parseInt(id);

    if (!trainingRecordId) {
      return NextResponse.json({ error: 'Invalid training record ID' }, { status: 400 });
    }

    // Check if record exists
    const [existing] = await db
      .select()
      .from(employeeTraining)
      .where(eq(employeeTraining.id, trainingRecordId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Training record not found' }, { status: 404 });
    }

    // Delete the record
    await db
      .delete(employeeTraining)
      .where(eq(employeeTraining.id, trainingRecordId));

    return NextResponse.json({
      success: true,
      message: 'Training record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee training:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee training', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/employee-training/[id] - Get employee training record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const trainingRecordId = parseInt(id);

    const [record] = await db
      .select()
      .from(employeeTraining)
      .where(eq(employeeTraining.id, trainingRecordId))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: 'Training record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching employee training:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee training', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/employee-training/[id] - Update employee training record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const trainingRecordId = parseInt(id);
    const body = await request.json();
    const {
      startDate,
      endDate,
      expiryDate,
      status,
      trainerName,
      notes,
      certificate,
    } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate).toISOString().split('T')[0] : null;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : null;
    if (status !== undefined) updateData.status = status;
    if (trainerName !== undefined) updateData.trainerName = trainerName;
    if (notes !== undefined) updateData.notes = notes;
    if (certificate !== undefined) updateData.certificate = certificate;

    const [updated] = await db
      .update(employeeTraining)
      .set(updateData)
      .where(eq(employeeTraining.id, trainingRecordId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Training record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Training record updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee training:', error);
    return NextResponse.json(
      { error: 'Failed to update employee training', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

