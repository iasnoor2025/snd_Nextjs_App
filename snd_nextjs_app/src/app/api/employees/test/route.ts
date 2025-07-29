import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Test API called');

    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');

    // Test simple query
    const count = await prisma.employee.count();
    console.log(`Total employees: ${count}`);

    // Test basic findMany without complex queries
    const employees = await prisma.employee.findMany({
      take: 5,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true
      }
    });

    console.log(`Found ${employees.length} employees`);

    return NextResponse.json({
      success: true,
      message: 'Database connection and basic queries work',
      data: {
        totalCount: count,
        sampleEmployees: employees
      }
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Test failed: ' + (error as Error).message,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
