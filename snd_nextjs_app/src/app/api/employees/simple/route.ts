import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withEmployeeOwnDataAccess } from '@/lib/rbac/api-middleware';

const getSimpleEmployeesHandler = async (request: NextRequest & { employeeAccess?: { ownEmployeeId?: number; user: any } }) => {
  try {
    console.log('Simple employees API called');

    // Test basic count
    const count = await prisma.employee.count();
    console.log(`Total employees: ${count}`);

    let employees;
    let whereClause: any = {};

    // For employee users, only show their own record
    if (request.employeeAccess?.ownEmployeeId) {
      whereClause.id = request.employeeAccess.ownEmployeeId;
    }

    // Test simple findMany without any complex options
    employees = await prisma.employee.findMany({
      where: whereClause,
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
};

export const GET = withEmployeeOwnDataAccess(getSimpleEmployeesHandler);
