import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeTraining } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/employee/[id]/training/[trainingId] - Update employee training record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trainingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId, trainingId } = await params;
    const body = await request.json();
    const { startDate, endDate, status, certificate, notes } = body;

    const [updatedEmployeeTraining] = await db
      .update(employeeTraining)
      .set({
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'planned',
        certificate,
        notes,
        updatedAt: new Date(),
      })
      .where(and(
        eq(employeeTraining.employeeId, parseInt(employeeId)),
        eq(employeeTraining.trainingId, parseInt(trainingId))
      ))
      .returning();

    if (!updatedEmployeeTraining) {
      return NextResponse.json({ error: 'Employee training record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedEmployeeTraining,
      message: 'Employee training record updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee training:', error);
    return NextResponse.json({ error: 'Failed to update employee training' }, { status: 500 });
  }
}

// DELETE /api/employee/[id]/training/[trainingId] - Remove training record from employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trainingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId, trainingId } = await params;

    const [deletedEmployeeTraining] = await db
      .delete(employeeTraining)
      .where(and(
        eq(employeeTraining.employeeId, parseInt(employeeId)),
        eq(employeeTraining.trainingId, parseInt(trainingId))
      ))
      .returning();

    if (!deletedEmployeeTraining) {
      return NextResponse.json({ error: 'Employee training record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Training record removed from employee successfully'
    });
  } catch (error) {
    console.error('Error removing employee training:', error);
    return NextResponse.json({ error: 'Failed to remove employee training' }, { status: 500 });
  }
}
