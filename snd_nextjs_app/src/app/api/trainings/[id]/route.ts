import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { trainings } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// PUT /api/trainings/[id] - Update a training program
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: trainingId } = await params;
    const body = await request.json();
    const { 
      name, 
      description, 
      category, 
      duration, 
      provider, 
      cost, 
      maxParticipants,
      prerequisites,
      objectives,
      materials,
      status
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Training name is required' }, { status: 400 });
    }

    const [updatedTraining] = await db
      .update(trainings)
      .set({
        name,
        description,
        category,
        duration,
        provider,
        cost: cost ? parseFloat(cost) : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        prerequisites,
        objectives,
        materials,
        status,
        updatedAt: new Date(),
      })
      .where(eq(trainings.id, parseInt(trainingId)))
      .returning();

    if (!updatedTraining) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedTraining,
      message: 'Training updated successfully'
    });
  } catch (error) {
    console.error('Error updating training:', error);
    return NextResponse.json({ error: 'Failed to update training' }, { status: 500 });
  }
}

// DELETE /api/trainings/[id] - Delete a training program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: trainingId } = await params;

    const [deletedTraining] = await db
      .delete(trainings)
      .where(eq(trainings.id, parseInt(trainingId)))
      .returning();

    if (!deletedTraining) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Training deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting training:', error);
    return NextResponse.json({ error: 'Failed to delete training' }, { status: 500 });
  }
}
