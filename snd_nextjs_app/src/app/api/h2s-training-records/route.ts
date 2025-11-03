import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeTraining, employees, trainings } from '@/lib/drizzle/schema';
import { eq, and, ilike, isNotNull, inArray, desc } from 'drizzle-orm';

// GET /api/h2s-training-records - Get all completed H2S training records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, find all H2S-related training programs
    const allTrainings = await db.select().from(trainings);
    
    const h2sTrainingIds = allTrainings
      .filter(t => 
        t.name?.toLowerCase().includes('h2s') ||
        t.name?.toLowerCase().includes('hydrogen sulfide') ||
        t.name?.toLowerCase().includes('scba') ||
        t.category?.toLowerCase().includes('safety')
      )
      .map(t => t.id);

    if (h2sTrainingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No H2S training programs found'
      });
    }

    // Fetch all employee training records for H2S trainings
    let employeeTrainings;
    
    if (h2sTrainingIds.length === 1) {
      employeeTrainings = await db
        .select({
          trainingRecord: employeeTraining,
          employee: employees,
          training: trainings,
        })
        .from(employeeTraining)
        .innerJoin(employees, eq(employeeTraining.employeeId, employees.id))
        .innerJoin(trainings, eq(employeeTraining.trainingId, trainings.id))
        .where(
          and(
            eq(employeeTraining.trainingId, h2sTrainingIds[0]),
            isNotNull(employeeTraining.endDate)
          )
        )
        .orderBy(desc(employeeTraining.endDate));
    } else if (h2sTrainingIds.length > 1) {
      employeeTrainings = await db
        .select({
          trainingRecord: employeeTraining,
          employee: employees,
          training: trainings,
        })
        .from(employeeTraining)
        .innerJoin(employees, eq(employeeTraining.employeeId, employees.id))
        .innerJoin(trainings, eq(employeeTraining.trainingId, trainings.id))
        .where(
          and(
            inArray(employeeTraining.trainingId, h2sTrainingIds),
            isNotNull(employeeTraining.endDate)
          )
        )
        .orderBy(desc(employeeTraining.endDate));
    } else {
      employeeTrainings = [];
    }

    // Transform the data
    const records = employeeTrainings.map(({ trainingRecord, employee, training }) => ({
      id: trainingRecord.id,
      employeeId: employee.id,
      trainingId: training.id,
      employeeName: `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim(),
      fileNumber: employee.fileNumber,
      trainingName: training.name,
      endDate: trainingRecord.endDate,
      expiryDate: trainingRecord.expiryDate || 
        (trainingRecord.endDate 
          ? new Date(new Date(trainingRecord.endDate).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null),
      status: trainingRecord.status,
      cardNumber: trainingRecord.cardNumber,
      hasCard: !!trainingRecord.cardNumber,
    }));

    return NextResponse.json({
      success: true,
      data: records,
      total: records.length,
    });
  } catch (error) {
    console.error('Error fetching H2S training records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch H2S training records', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

