import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

import { db } from '@/lib/drizzle';
import { employeeTraining, employees, trainings } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/employee/[id]/training - Create a new employee training record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const body = await request.json();
    const { 
      trainingId, 
      startDate, 
      endDate, 
      status = 'completed', 
      certificate, 
      notes,
      trainerName,
      expiryDate 
    } = body;

    // Validate required fields
    if (!trainingId) {
      return NextResponse.json({ error: 'Training ID is required' }, { status: 400 });
    }

    // Verify employee exists
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, parseInt(employeeId)))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Verify training exists
    const [training] = await db
      .select({ id: trainings.id })
      .from(trainings)
      .where(eq(trainings.id, parseInt(trainingId)))
      .limit(1);

    if (!training) {
      return NextResponse.json({ error: 'Training program not found' }, { status: 404 });
    }

    // Check if training record already exists
    const [existing] = await db
      .select()
      .from(employeeTraining)
      .where(and(
        eq(employeeTraining.employeeId, parseInt(employeeId)),
        eq(employeeTraining.trainingId, parseInt(trainingId))
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json({ 
        error: 'Training record already exists for this employee',
        data: existing 
      }, { status: 409 });
    }

    // Create new training record
    const [newTraining] = await db
      .insert(employeeTraining)
      .values({
        employeeId: parseInt(employeeId),
        trainingId: parseInt(trainingId),
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
        status: status,
        certificate: certificate || null,
        notes: notes || null,
        trainerName: trainerName || null,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : null,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newTraining,
      message: 'Employee training record created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee training:', error);
    return NextResponse.json({ 
      error: 'Failed to create employee training',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

