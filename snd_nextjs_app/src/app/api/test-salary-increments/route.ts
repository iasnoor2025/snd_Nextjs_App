import { db } from '@/lib/drizzle';
import { salaryIncrements } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing salary increments query...');

    // Test 1: Simple count query
    const countResult = await db.select({ count: salaryIncrements.id }).from(salaryIncrements);

    console.log('Count result:', countResult.length);

    // Test 2: Query with employee ID filter
    const employeeId = 1; // Test with employee ID 1
    console.log('Testing query with employee ID:', employeeId);

    const filteredResult = await db
      .select({
        id: salaryIncrements.id,
        employeeId: salaryIncrements.employeeId,
        status: salaryIncrements.status,
        createdAt: salaryIncrements.createdAt,
      })
      .from(salaryIncrements)
      .where(eq(salaryIncrements.employeeId, employeeId))
      .limit(5);

    console.log('Filtered result count:', filteredResult.length);
    console.log('Sample data:', filteredResult);

    // Test 3: Check if table has any data
    const allData = await db
      .select({
        id: salaryIncrements.id,
        employeeId: salaryIncrements.employeeId,
        status: salaryIncrements.status,
      })
      .from(salaryIncrements)
      .limit(10);

    console.log('Total table data count:', allData.length);

    return NextResponse.json({
      success: true,
      message: 'Salary increments query test successful',
      totalCount: countResult.length,
      filteredCount: filteredResult.length,
      sampleData: filteredResult,
      allDataCount: allData.length,
      sampleAllData: allData,
    });
  } catch (error) {
    console.error('Salary increments test failed:', error);

    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Salary increments query test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
