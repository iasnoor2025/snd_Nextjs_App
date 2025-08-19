import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeTraining, trainings, employees } from '@/lib/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/employee/[id]/training - Get employee training records
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;

    const employeeTrainings = await db
      .select({
        id: employeeTraining.id,
        startDate: employeeTraining.startDate,
        endDate: employeeTraining.endDate,
        status: employeeTraining.status,
        certificate: employeeTraining.certificate,
        notes: employeeTraining.notes,
        createdAt: employeeTraining.createdAt,
        updatedAt: employeeTraining.updatedAt,
        training: {
          id: trainings.id,
          name: trainings.name,
          description: trainings.description,
          category: trainings.category,
          duration: trainings.duration,
          provider: trainings.provider,
          cost: trainings.cost,
        }
      })
      .from(employeeTraining)
      .innerJoin(trainings, eq(employeeTraining.trainingId, trainings.id))
      .where(eq(employeeTraining.employeeId, parseInt(employeeId)))
      .orderBy(desc(employeeTraining.createdAt));

    return NextResponse.json({
      success: true,
      data: employeeTrainings
    });
  } catch (error) {
    console.error('Error fetching employee training:', error);
    return NextResponse.json({ error: 'Failed to fetch employee training' }, { status: 500 });
  }
}

// POST /api/employee/[id]/training - Add training record to employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const body = await request.json();
    const { trainingId, startDate, endDate, status, certificate, notes } = body;

    if (!trainingId) {
      return NextResponse.json({ error: 'Training ID is required' }, { status: 400 });
    }

    // Check if employee exists
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, parseInt(employeeId)))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const [newEmployeeTraining] = await db
      .insert(employeeTraining)
      .values({
        employeeId: parseInt(employeeId),
        trainingId: parseInt(trainingId),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'planned',
        certificate,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newEmployeeTraining,
      message: 'Training record added to employee successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding training to employee:', error);
    return NextResponse.json({ error: 'Failed to add training to employee' }, { status: 500 });
  }
}
