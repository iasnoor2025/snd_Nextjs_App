import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Simple employees API called');

    // Test basic count
    const count = await prisma.employee.count();
    console.log(`Total employees: ${count}`);

    // Test simple findMany without any complex options
    const employees = await prisma.employee.findMany({
      take: 5,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      } as any
    });

    console.log(`Found ${employees.length} employees`);

    return NextResponse.json({
      success: true,
      message: 'Simple query works',
      data: {
        totalCount: count,
        employees: employees
      }
    });
  } catch (error) {
    console.error('Simple API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Simple query failed: ' + (error as Error).message,
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
